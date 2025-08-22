import { BaseApiService } from "./baseService";

export interface ProcessCompanyRequest {
  company_name: string;
}

export interface ProcessCompanyResponse {
  success: boolean;
  message?: string;
  company_name?: string;
  company_id?: string;
  conversation_id?: string; // Add this field
  processed_at?: string;
  error?: string;
}

export class CompanyService extends BaseApiService {
  constructor() {
    super("/company"); // Base path for company endpoints
  }

  /**
   * Process a company name through the AI pipeline, savvy!
   */
  async processCompany(companyName: string): Promise<ProcessCompanyResponse> {
    try {
      console.log(`[CompanyService] Processing company: ${companyName}`);

      const response = await this.post<ProcessCompanyResponse>(
        "/process-company",
        {
          company_name: companyName,
        }
      );

      console.log("[CompanyService] Company processed:", response.success);
      return response;
    } catch (error) {
      console.error("[CompanyService] Error processing company:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}

export const companyService = new CompanyService();
