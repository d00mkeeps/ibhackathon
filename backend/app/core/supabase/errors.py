from fastapi import HTTPException, status
from typing import Dict, Any, Optional

class APIError(Exception):
    """
    Custom API error with status code and detail
    """
    def __init__(
        self, 
        detail: str, 
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        headers: Optional[Dict[str, Any]] = None
    ):
        self.detail = detail
        self.status_code = status_code
        self.headers = headers
        super().__init__(self.detail)
    
    def to_http_exception(self) -> HTTPException:
        """
        Convert to FastAPI HTTPException
        """
        return HTTPException(
            status_code=self.status_code,
            detail=self.detail,
            headers=self.headers
        )

# Common error types
class NotFoundError(APIError):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)

class UnauthorizedError(APIError):
    def __init__(self, detail: str = "Not authorized"):
        super().__init__(detail, status.HTTP_401_UNAUTHORIZED, {"WWW-Authenticate": "Bearer"})

class BadRequestError(APIError):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)