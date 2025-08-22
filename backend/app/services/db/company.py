from app.core.supabase.client import supabase_client
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class CompanyDBService:
    def __init__(self):
        # No setup needed - the client handles everything!
        self.supabase = supabase_client.get_client()
        logger.info("🏴‍☠️ CompanyDBService ready for action!")
    
    def save_company_analysis(self, company_name: str, conversation_id: str) -> Dict[str, Any]:
        """Save company to database with conversation ID - now with proper relationships, arrr!"""
        try:
            logger.info(f"🏴‍☠️ Saving company to DB: {company_name} with conversation: {conversation_id}")
            
            result = self.supabase.table("company_analysis").insert({
                "name": company_name.strip(),
                "conversation_id": conversation_id  # Link to the conversation, savvy!
            }).execute()
            
            if result.data and len(result.data) > 0:
                record = result.data[0]
                logger.info(f"🏴‍☠️ Company saved with ID: {record['id']} and conversation: {conversation_id}")
                return {
                    "success": True,
                    "id": record["id"],
                    "name": record["name"],
                    "conversation_id": record["conversation_id"],
                    "created_at": record["created_at"]
                }
            else:
                logger.error(f"🏴‍☠️ No data returned: {result}")
                raise Exception("No data returned from insert")
                
        except Exception as e:
            logger.error(f"🏴‍☠️ Failed to save company: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_company_analysis(self, conversation_id: str) -> Dict[str, Any]:
        """Get company analysis by conversation ID"""
        try:
            logger.info(f"🏴‍☠️ Fetching company for conversation: {conversation_id}")
            result = self.supabase.table("company_analysis").select('*').eq('conversation_id', conversation_id).execute()
            if result.data and len(result.data) > 0:
                company = result.data[0]
                logger.info(f"🏴‍☠️ Found company: {company['name']}")
                return {"success": True, "company": company}
            else:
                return {"success": False, "error": "No company found"}
        except Exception as e:
            logger.error(f"🏴‍☠️ Failed to get company: {str(e)}")
            return {"success": False, "error": str(e)}

# Single instance, simple as can be!
company_db_service = CompanyDBService()