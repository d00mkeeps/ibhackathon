from typing import AsyncGenerator, Dict, Any, List
import logging
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage

logger = logging.getLogger(__name__)

class BaseConversationChain:
    """
    Base class for all conversation chains.
    
    Handles:
    - Universal LLM streaming logic
    - Message history management  
    - Error handling
    - Context loading
    
    Subclasses must implement:
    - get_formatted_prompt() - for chain-specific prompt formatting
    """
    
    def __init__(self, llm: ChatVertexAI):
        self.chat_model = llm
        self.messages: List[BaseMessage] = []

    async def process_message(self, message: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Universal LLM streaming logic.
        
        Gets formatted prompt from subclass, streams LLM response,
        manages conversation history, handles errors.
        """
        try:
            # Get formatted prompt from subclass
            formatted_prompt = await self.get_formatted_prompt(message)
            
            # Log the formatted messages for debugging
            logger.info("\n=== Formatted Messages ===")
            for i, msg in enumerate(formatted_prompt):
                logger.info(f"\nMessage {i+1} ({type(msg).__name__}):")
                logger.info(f"Content: {msg.content}")
            logger.info("=====================")
            
            # Stream the response
            full_response = ""
            async for chunk in self.chat_model.astream(input=formatted_prompt):
                logger.info(f"Chunk: content='{chunk.content}', metadata={getattr(chunk, 'response_metadata', None)}")
                
                chunk_content = chunk.content
                if chunk_content:  # Only send non-empty content chunks
                    full_response += chunk_content
                    yield {
                        "type": "content",
                        "data": chunk_content
                    }

            # Send completion signal
            yield {
                "type": "complete",
                "data": {"length": len(full_response)}
            }

            # Add both messages to history after successful processing
            self.messages.append(HumanMessage(content=message))
            self.messages.append(AIMessage(content=full_response))
            
            logger.debug("\n=== Final Conversation State ===")
            logger.debug(f"Total messages: {len(self.messages)}")
            logger.debug("=====================")
                
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)
            yield {
                "type": "error",
                "data": "An error occurred while processing your message"
            }

    async def get_formatted_prompt(self, message: str):
        """
        Format the prompt for LangChain.
        
        Must be implemented by subclasses to handle their specific
        prompt templates, context formatting, etc.
        
        Args:
            message: The current user message
            
        Returns:
            Formatted messages ready for LangChain
        """
        raise NotImplementedError("Subclasses must implement get_formatted_prompt")


    