import { apiGet, apiPost, apiDelete, apiPatch } from './core/apiClient';

/**
 * Base API service to be extended by specific domain services
 */
export class BaseApiService {
  protected basePath: string;
  
  constructor(basePath: string) {
    // Remove trailing slash if present
    this.basePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  }
  
  /**
   * Build endpoint URL
   */
  protected buildEndpoint(path: string = ''): string {
    // Handle paths with or without leading slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.basePath}${normalizedPath}`;
  }
  
  /**
   * Generic GET request
   */
  protected async get<T = any>(path: string = '', params: Record<string, any> = {}): Promise<T> {
    return apiGet<T>(this.buildEndpoint(path), params);
  }
  
  /**
   * Generic POST request
   */
  protected async post<T = any>(path: string = '', data: any): Promise<T> {
    return apiPost<T>(this.buildEndpoint(path), data);
  }
  
  /**
   * Generic DELETE request
   */
  protected async delete<T = any>(path: string = ''): Promise<T> {
    return apiDelete<T>(this.buildEndpoint(path));
  }
  
  /**
   * Generic PATCH request
   */
  protected async patch<T = any>(path: string = '', data: any): Promise<T> {
    return apiPatch<T>(this.buildEndpoint(path), data);
  }
  
  /**
   * Standard error handler
   */
  protected handleError(error: any): never {
    console.error(`[${this.constructor.name}] API error:`, error);
    throw error;
  }
}