import logging
import json
import os
from typing import Dict, Any
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, Depends, HTTPException
from dotenv import load_dotenv
from google.oauth2 import service_account
from app.services.llm.investment_analysis_service import InvestmentAnalysisLLMService

load_dotenv()
logger = logging.getLogger(__name__)
router = APIRouter()

def get_google_credentials():
    """Initialize Google Cloud credentials directly from JSON"""
    credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    
    if not credentials_json:
        logger.error("GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable not set")
        raise HTTPException(status_code=500, detail="Google Cloud credentials not configured")
    
    if not project_id:
        logger.error("GOOGLE_CLOUD_PROJECT environment variable not set")
        raise HTTPException(status_code=500, detail="Google Cloud project not configured")
    
    try:
        credentials_info = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(credentials_info)
        return {"credentials": credentials, "project_id": project_id}
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid Google Cloud credentials JSON")
# Dependency to get CARA LLM service
def get_cara_llm_service(creds: dict = Depends(get_google_credentials)):
    return InvestmentAnalysisLLMService(
        credentials=creds["credentials"], 
        project_id=creds["project_id"]
    )

# Custom JSON encoder that handles datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        from datetime import datetime
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Helper to safely send JSON with datetime objects
async def send_json_safe(websocket: WebSocket, data: Dict[str, Any]):
    try:
        json_str = json.dumps(data, cls=DateTimeEncoder)
        await websocket.send_text(json_str)
    except Exception as e:
        logger.error(f"Error sending JSON: {str(e)}")
        await websocket.send_json({
            "type": "error",
            "data": {"message": "Error sending response"}
        })

@router.websocket("/ws/chat")
async def chat_websocket(
    websocket: WebSocket,
    conversation_id: str = Query(None),  # Accept as query parameter
    cara_service: InvestmentAnalysisLLMService = Depends(get_cara_llm_service)
):
    """CARA WebSocket endpoint with optional company context"""
    try:
        await cara_service.process_websocket(websocket, conversation_id)
    except WebSocketDisconnect:
        logger.info("CARA WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in CARA websocket: {str(e)}", exc_info=True)