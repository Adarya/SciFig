"""Structured logging utilities"""

import json
import time
import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import logging
import sys

# Configure Python logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',  # We'll format our own JSON messages
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("scifig")


class StructuredLogger:
    """Structured logger with JSON output"""
    
    @staticmethod
    def _format_log_entry(
        level: str,
        message: str,
        **kwargs
    ) -> str:
        """Format log entry as JSON"""
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level,
            "message": message,
            "service": "scifig-api",
            **kwargs
        }
        
        # Remove None values
        entry = {k: v for k, v in entry.items() if v is not None}
        
        return json.dumps(entry, default=str)
    
    @classmethod
    def info(cls, message: str, **kwargs):
        """Log info level message"""
        logger.info(cls._format_log_entry("INFO", message, **kwargs))
    
    @classmethod 
    def warning(cls, message: str, **kwargs):
        """Log warning level message"""
        logger.warning(cls._format_log_entry("WARNING", message, **kwargs))
    
    @classmethod
    def error(cls, message: str, error: Optional[Exception] = None, **kwargs):
        """Log error level message"""
        error_data = {}
        if error:
            error_data = {
                "error_type": type(error).__name__,
                "error_message": str(error),
                "error_details": getattr(error, '__dict__', {})
            }
        
        logger.error(cls._format_log_entry("ERROR", message, **error_data, **kwargs))
    
    @classmethod
    def debug(cls, message: str, **kwargs):
        """Log debug level message"""
        logger.debug(cls._format_log_entry("DEBUG", message, **kwargs))


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests and responses"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.logger = StructuredLogger()
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Generate request ID for tracing
        request_id = str(uuid.uuid4())
        start_time = time.time()
        
        # Extract request info
        request_info = await self._extract_request_info(request, request_id)
        
        # Log incoming request
        self.logger.info(
            "Incoming request",
            request_id=request_id,
            method=request_info["method"],
            path=request_info["path"],
            query_params=request_info.get("query_params"),
            user_agent=request_info.get("user_agent"),
            client_ip=request_info.get("client_ip"),
            content_length=request_info.get("content_length")
        )
        
        # Add request ID to request state for use in endpoints
        request.state.request_id = request_id
        
        try:
            response = await call_next(request)
        except Exception as e:
            # Log unhandled exceptions
            processing_time = time.time() - start_time
            self.logger.error(
                "Request failed with unhandled exception",
                error=e,
                request_id=request_id,
                method=request_info["method"],
                path=request_info["path"],
                processing_time_ms=round(processing_time * 1000, 2)
            )
            raise
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Log response
        self.logger.info(
            "Request completed",
            request_id=request_id,
            method=request_info["method"],
            path=request_info["path"],
            status_code=response.status_code,
            processing_time_ms=round(processing_time * 1000, 2),
            response_size=response.headers.get("content-length")
        )
        
        # Add request ID to response headers for client-side tracing
        response.headers["X-Request-ID"] = request_id
        
        return response
    
    async def _extract_request_info(self, request: Request, request_id: str) -> Dict[str, Any]:
        """Extract relevant request information for logging"""
        info = {
            "method": request.method,
            "path": str(request.url.path),
            "query_params": dict(request.query_params) if request.query_params else None,
        }
        
        # Extract headers
        headers = dict(request.headers)
        info["user_agent"] = headers.get("user-agent")
        info["content_type"] = headers.get("content-type")
        info["content_length"] = headers.get("content-length")
        
        # Extract client IP (considering proxies)
        info["client_ip"] = (
            headers.get("x-forwarded-for", "").split(",")[0].strip() or
            headers.get("x-real-ip") or
            getattr(request.client, "host", "unknown")
        )
        
        # For debug mode, include more headers
        debug_headers = ["authorization", "accept", "accept-encoding", "connection"]
        debug_info = {k: headers.get(k) for k in debug_headers if k in headers}
        if debug_info:
            info["debug_headers"] = debug_info
        
        return info


class APILogger:
    """Logger specifically for API operations"""
    
    def __init__(self):
        self.logger = StructuredLogger()
    
    def log_auth_attempt(self, email: str, success: bool, request_id: Optional[str] = None):
        """Log authentication attempt"""
        self.logger.info(
            "Authentication attempt",
            email=email,
            success=success,
            request_id=request_id,
            event_type="auth"
        )
    
    def log_analysis_start(
        self, 
        analysis_type: str, 
        user_id: Optional[str] = None, 
        request_id: Optional[str] = None
    ):
        """Log start of statistical analysis"""
        self.logger.info(
            "Statistical analysis started",
            analysis_type=analysis_type,
            user_id=user_id,
            request_id=request_id,
            event_type="analysis_start"
        )
    
    def log_analysis_complete(
        self, 
        analysis_type: str, 
        success: bool,
        processing_time_ms: float,
        user_id: Optional[str] = None, 
        request_id: Optional[str] = None,
        error_message: Optional[str] = None
    ):
        """Log completion of statistical analysis"""
        self.logger.info(
            "Statistical analysis completed",
            analysis_type=analysis_type,
            success=success,
            processing_time_ms=round(processing_time_ms, 2),
            user_id=user_id,
            request_id=request_id,
            error_message=error_message,
            event_type="analysis_complete"
        )
    
    def log_usage_limit_hit(
        self, 
        feature_type: str, 
        user_id: Optional[str] = None, 
        ip_address: Optional[str] = None,
        request_id: Optional[str] = None
    ):
        """Log when usage limits are reached"""
        self.logger.warning(
            "Usage limit exceeded",
            feature_type=feature_type,
            user_id=user_id,
            ip_address=ip_address,
            request_id=request_id,
            event_type="usage_limit"
        )
    
    def log_database_error(
        self, 
        operation: str, 
        error: Exception,
        request_id: Optional[str] = None
    ):
        """Log database operation errors"""
        self.logger.error(
            f"Database operation failed: {operation}",
            error=error,
            operation=operation,
            request_id=request_id,
            event_type="database_error"
        )
    
    def log_security_event(
        self, 
        event_type: str, 
        description: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        request_id: Optional[str] = None
    ):
        """Log security-related events"""
        self.logger.warning(
            f"Security event: {event_type}",
            security_event_type=event_type,
            description=description,
            user_id=user_id,
            ip_address=ip_address,
            request_id=request_id,
            event_type="security"
        )


# Global API logger instance
api_logger = APILogger()


def get_request_id(request: Request) -> Optional[str]:
    """Extract request ID from request state"""
    return getattr(request.state, 'request_id', None)
