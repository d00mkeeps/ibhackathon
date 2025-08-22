import logging
import google.api_core.exceptions
from langchain_google_vertexai import ChatVertexAI
from app.services.chains.investment_analysis_chain import InvestmentAnalysisChain
from google.oauth2.credentials import Credentials
logger = logging.getLogger(__name__)

class InvestmentAnalysisLLMService:
    """Service for CARA (Complex Analysis Research Assistant)"""
    
    def __init__(self, credentials: Credentials = None, project_id: str = None):
        self._chain = None
        self.credentials = credentials
        self.project_id = project_id
        
    def get_chain(self) -> InvestmentAnalysisChain:
        """Get or create the analysis chain"""
        if self._chain is None:
            # Initialize LLM with explicit credentials
            llm = ChatVertexAI(
                model="gemini-2.5-pro",
                streaming=True,
                max_retries=0,
                temperature=0,
                credentials=self.credentials,  # Pass credentials explicitly
                project=self.project_id       # Pass project ID explicitly
            )
                    
            # Create chain
            self._chain = InvestmentAnalysisChain(llm=llm)
            
        return self._chain

        
    async def process_websocket(self, websocket, conversation_id: str = None):
        """Process WebSocket with optional company context"""
        try:
            await websocket.accept()
            logger.info("CARA WebSocket connection accepted")
            
            await websocket.send_json({
                "type": "connection_status", 
                "data": "connected"
            })
            
            # Get chain and load company context if conversation_id provided
            chain = self.get_chain()
            
            if conversation_id:
                # Load company context
                from app.services.db.company import company_db_service
                company_result = company_db_service.get_company_analysis(conversation_id)
                if company_result["success"]:
                    chain.load_company_context(company_result["company"])
                    logger.info(f"🏴‍☠️ Loaded company context: {company_result['company']['name']}")
            
            # Process messages (your existing while loop)
            while True:
                data = await websocket.receive_json()
                
                # Handle heartbeat
                if data.get('type') == 'heartbeat':
                    await websocket.send_json({
                        "type": "heartbeat_ack",
                        "timestamp": data.get('timestamp')
                    })
                    continue
                
                # Handle regular messages
                if data.get('type') == 'message' or 'message' in data:
                    message = data.get('message', '')
                    if message.strip():
                        # Process message through chain
                        async for response in chain.process_message(message):
                            await websocket.send_json(response)
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "data": {"message": "Empty message received"}
                        })
                            
        except google.api_core.exceptions.ResourceExhausted as e:
            logger.error(f"Rate limit exceeded: {str(e)}")
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": {
                        "code": "rate_limit",
                        "message": "Rate limit exceeded. Please try again later.",
                        "retry_after": 60
                    }
                })
            except:
                pass
                
        except Exception as e:
            logger.error(f"Error in CARA websocket: {str(e)}", exc_info=True)
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": {
                        "message": f"Connection error: {str(e)}"
                    }
                })
                await websocket.close(code=1011)
            except:
                pass