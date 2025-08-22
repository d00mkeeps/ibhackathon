from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.supabase.errors import APIError
# from app.api.endpoints.llm import router as llm_router
from app.api.endpoints.llm import router as chat_router  # Add this line!
from app.api.endpoints.company import router as company_router
from app.api.endpoints.conversations import router as conversations_router 
from fastapi.middleware.cors import CORSMiddleware
from app.core.logging_config import setup_logging
import logging
import os
from dotenv import load_dotenv
from pathlib import Path

setup_logging()
logger = logging.getLogger(__name__)
logger.info("Application starting")

project_root = Path(__file__).parent.absolute()
env_path = project_root / '.env'
load_dotenv(dotenv_path=env_path)
logger.info(f"Loading .env from: {env_path} (exists: {os.path.exists(str(env_path))})")

# Log Supabase environment variables presence
logger.info(f"SUPABASE_URL present: {os.environ.get('SUPABASE_URL') is not None}")
logger.info(f"SUPABASE_KEY present: {os.environ.get('SUPABASE_KEY') is not None}")

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Debug middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.info(f"Response status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        raise

# Add exception handler for custom API errors
@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    logger.error(f"API Error: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# General exception handler
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Updated path to remove redundant /api/llm/ws prefix
# app.include_router(llm_router, tags=["llm"])
app.include_router(company_router, tags=["company"])
app.include_router(conversations_router, tags=["conversations"])  # Add this line!
app.include_router(chat_router, tags=["chat"])  # Add this line!

@app.get("/health")
async def health_check():
    """
    Basic health check endpoint to verify the API is running
    """
    # Also check Supabase connection if possible
    supabase_env_ok = os.environ.get("SUPABASE_URL") is not None and os.environ.get("SUPABASE_KEY") is not None
    
    return {
        "status": "ok", 
        "service": "api",
        "supabase_env": "ok" if supabase_env_ok else "missing"
    }