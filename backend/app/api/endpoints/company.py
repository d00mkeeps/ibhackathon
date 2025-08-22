from fastapi import APIRouter
from pydantic import BaseModel
import logging
from datetime import datetime
from app.services.db.company import company_db_service
from app.services.db.conversation import ConversationService
from app.core.supabase.client import supabase_client

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize conversation service, savvy!
conversation_service = ConversationService(supabase_client.get_client())

class ProcessCompanyRequest(BaseModel):
    company_name: str

class ProcessCompanyResponse(BaseModel):
    success: bool
    message: str
    company_name: str
    company_id: str = ""
    conversation_id: str = ""  # New field for conversation ID!
    processed_at: str

@router.post("/company/process-company")
async def process_company(request: ProcessCompanyRequest):
    """
    Save company to database with conversation and return IDs for future AI context, savvy!
    """
    try:
        company_name = request.company_name.strip()
        
        # Log the company name
        logger.info(f"🏴‍☠️ PROCESSING COMPANY: {company_name}")
        print(f"=== COMPANY ANALYSIS REQUEST: {company_name} ===")
        
        # Create conversation name with current date - arrr!
        current_date = datetime.now().strftime("%d/%m/%Y")
        conversation_name = f"{company_name} analysis - {current_date}"
        
        # Create the conversation first, ye landlubber!
        conversation = conversation_service.create_conversation(conversation_name)
        
        # Save to database with conversation ID
        db_result = company_db_service.save_company_analysis(company_name, conversation["id"])
        
        if not db_result["success"]:
            raise Exception(f"Database error: {db_result.get('error', 'Unknown error')}")
        
        return ProcessCompanyResponse(
            success=True,
            message=f"Company '{company_name}' and conversation saved successfully, captain!",
            company_name=company_name,
            company_id=db_result["id"],
            conversation_id=conversation["id"],
            processed_at=db_result["created_at"]
        )
        
    except Exception as e:
        logger.error(f"Error processing company: {str(e)}")
        return ProcessCompanyResponse(
            success=False,
            message=f"Failed to process company: {str(e)}",
            company_name="",
            company_id="",
            conversation_id="",
            processed_at=""
        )