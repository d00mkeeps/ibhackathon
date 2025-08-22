import { BaseApiService } from "./baseService";

export interface ConversationResponse {
  id: string;
  name: string;
  created_at: string;
}

export interface GetConversationsResponse {
  success: boolean;
  conversations: ConversationResponse[];
  message?: string;
  error?: string;
}

export class ConversationService extends BaseApiService {
  constructor() {
    super("/conversations"); // Base path for conversation endpoints, savvy!
  }

  /**
   * Fetch all conversations from the treasure chest, arrr!
   */
  async getAllConversations(): Promise<GetConversationsResponse> {
    try {
      console.log("[ConversationService] Fetching all conversations");

      const response = await this.get<GetConversationsResponse>("");

      console.log(
        `[ConversationService] Found ${
          response.conversations?.length || 0
        } conversations`
      );
      return response;
    } catch (error) {
      console.error(
        "[ConversationService] Error fetching conversations:",
        error
      );
      return {
        success: false,
        conversations: [],
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}

export const conversationService = new ConversationService();
