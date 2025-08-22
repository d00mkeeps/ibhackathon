import { getLocalIpAddress } from "@/utils/network";
import { supabase } from "@/lib/supabaseClient";

// State variables for base URLs
let API_BASE_URL: string | null = null;
let WS_BASE_URL: string | null = null;

/**
 * Initialize the API client with the correct base URLs
 */
export async function initializeApiClient(): Promise<void> {
  if (!API_BASE_URL) {
    try {
      const ipAddress = await getLocalIpAddress();
      API_BASE_URL = `http://${ipAddress}:8000`;
      WS_BASE_URL = `ws://${ipAddress}:8000/api/llm`;
      console.log(`[apiClient] Initialized with base URL: ${API_BASE_URL}`);
    } catch (error) {
      console.error("[apiClient] Failed to initialize:", error);
      throw new Error(
        "Failed to initialize API client: Could not resolve IP address"
      );
    }
  }
}

/**
 * Get the current base URL for API requests
 */
export async function getApiBaseUrl(): Promise<string> {
  await initializeApiClient();
  return API_BASE_URL!;
}

/**
 * Get the current base URL for WebSocket connections
 */
export async function getWsBaseUrl(): Promise<string> {
  await initializeApiClient();
  return WS_BASE_URL!;
}

/**
 * Endpoints that don't require authentication
 */
const PUBLIC_ENDPOINTS = ["/health", "/status", "/company", "/conversations"];

/**
 * Check if an endpoint requires authentication
 */
function requiresAuth(endpoint: string): boolean {
  return !PUBLIC_ENDPOINTS.some((publicEndpoint) =>
    endpoint.startsWith(publicEndpoint)
  );
}

/**
 * Get fresh JWT token from Supabase
 */
/**
 * Get fresh JWT token from Supabase
 */
async function getFreshToken(): Promise<string | null> {
  try {
    // First try to get current session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("[apiClient] Error getting session:", error);
      return null;
    }

    if (!session) {
      console.log("[apiClient] No session available");
      return null;
    }

    // Check if token is close to expiring (within 5 minutes)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;

      if (timeUntilExpiry < 300) {
        // Less than 5 minutes
        console.log("[apiClient] Token expiring soon, refreshing...");
        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError) {
          console.error("[apiClient] Error refreshing session:", refreshError);
          return null;
        }

        if (refreshData.session?.access_token) {
          console.log("[apiClient] Token refreshed successfully");
          return refreshData.session.access_token;
        }
      }
    }

    return session.access_token;
  } catch (error) {
    console.error("[apiClient] Error in getFreshToken:", error);
    return null;
  }
}
/**
 * Simplified API request function
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  await initializeApiClient();

  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  console.log(`[apiClient] Request to: ${url}`);

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add any existing headers
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === "string") {
        headers[key] = value;
      } else if (value !== undefined && value !== null) {
        headers[key] = String(value);
      }
    });
  }

  // Add authorization header if required
  if (requiresAuth(normalizedEndpoint)) {
    const token = await getFreshToken();

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn(
        "[apiClient] No valid token available for authenticated endpoint"
      );
      // You might want to redirect to login here
      throw new Error("Authentication required");
    }
  }

  try {
    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle response
    if (!response.ok) {
      // Handle 401 Unauthorized - try one refresh
      if (response.status === 401) {
        console.log("[apiClient] Received 401, attempting token refresh...");

        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();

        if (!refreshError && refreshData.session?.access_token) {
          console.log("[apiClient] Token refreshed, retrying request");
          headers[
            "Authorization"
          ] = `Bearer ${refreshData.session.access_token}`;

          // Retry once with fresh token
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });

          if (retryResponse.ok) {
            const contentType = retryResponse.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              return await retryResponse.json();
            }
            return { success: true } as unknown as T;
          }
        }

        // If refresh failed or retry still got 401, redirect to login
        console.error(
          "[apiClient] Authentication failed, redirecting to login"
        );
        // Handle auth failure (redirect to login, clear storage, etc.)
        await supabase.auth.signOut();
        throw new Error("Authentication failed");
      }

      // Handle other HTTP errors
      let errorDetail: string;
      try {
        const errorJson = await response.json();
        errorDetail =
          errorJson.detail ||
          errorJson.message ||
          `HTTP error ${response.status}`;
      } catch {
        errorDetail = `API error: ${response.status} ${response.statusText}`;
      }

      throw new Error(errorDetail);
    }

    // Parse successful response
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return { success: true } as unknown as T;
  } catch (error) {
    console.error(`[apiClient] Request failed: ${endpoint}`, error);
    throw error;
  }
}

// Helper methods (unchanged)
export const apiGet = <T = any>(
  endpoint: string,
  params: Record<string, any> = {}
) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;

  return apiRequest<T>(url, { method: "GET" });
};

export const apiPost = <T = any>(endpoint: string, data: any) => {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const apiPut = <T = any>(endpoint: string, data: any) => {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const apiPatch = <T = any>(endpoint: string, data: any) => {
  return apiRequest<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const apiDelete = <T = any>(endpoint: string) => {
  return apiRequest<T>(endpoint, { method: "DELETE" });
};
