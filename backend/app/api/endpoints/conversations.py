from fastapi import APIRouter
from pydantic import BaseModel
import logging
from typing import List
from app.services.db.conversation import ConversationService
from app.core.supabase.client import supabase_client

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize conversation service, savvy!
conversation_service = ConversationService(supabase_client.get_client())

class ConversationResponse(BaseModel):
    id: str
    name: str
    created_at: str

class GetConversationsResponse(BaseModel):
    success: bool
    conversations: List[ConversationResponse] = []
    message: str = ""

@router.get("/conversations")
async def get_all_conversations():
    """
    Fetch all conversations for the treasure chest, arrr!
    """
    try:
        logger.info("🏴‍☠️ FETCHING ALL CONVERSATIONS")
        print("=== CONVERSATIONS REQUEST ===")
        
        # Get all conversations from the service
        conversations = conversation_service.get_all_conversations()
        
        return GetConversationsResponse(
            success=True,
            conversations=[
                ConversationResponse(
                    id=conv["id"],
                    name=conv["name"],
                    created_at=conv["created_at"]
                ) for conv in conversations
            ],
            message=f"Found {len(conversations)} conversations, captain!"
        )
        
    except Exception as e:
        logger.error(f"Error fetching conversations: {str(e)}")
        return GetConversationsResponse(
            success=False,
            conversations=[],
            message=f"Failed to fetch conversations: {str(e)}"
        )