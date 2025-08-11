"""Figure analysis routes"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from typing import Optional
import uuid

from ..auth.dependencies import get_optional_user
from ..auth.models import UserResponse
from ..config.database import get_admin_db_client
from ..utils.usage_limits import UsageLimiter
from supabase import Client

router = APIRouter(prefix="/figure_analysis", tags=["figure analysis"])


@router.post("/analyze")
async def analyze_figure(
    file: UploadFile = File(...),
    http_request: Request = Request,
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    admin_db: Client = Depends(get_admin_db_client)
):
    """Analyze an uploaded figure/image"""
    try:
        # Check usage limits for anonymous users
        limiter = UsageLimiter(admin_db)
        user_id = current_user.id if current_user else None
        
        allowed = await limiter.check_and_increment_usage(
            http_request, 
            'figure_analysis', 
            user_id
        )
        
        if not allowed:
            if current_user:
                limit = limiter.LIMITS['authenticated'].get('figure_analysis', 3)
                detail = f"Usage limit exceeded. Users are limited to {limit} figure analyses. Please upgrade your plan for more access."
            else:
                limit = limiter.LIMITS['anonymous'].get('figure_analysis', 1)
                detail = f"Usage limit exceeded. Anonymous users are limited to {limit} figure analysis. Please sign up for more access."
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=detail
            )
        
        # Basic file validation
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are supported"
            )
        
        # For now, return a mock analysis result
        # In a real implementation, this would process the image
        analysis_id = str(uuid.uuid4())
        
        return {
            "analysis_id": analysis_id,
            "filename": file.filename,
            "content_type": file.content_type,
            "size": file.size,
            "status": "completed",
            "analysis_type": "figure_analysis",
            "results": {
                "chart_type": "scatter_plot",
                "data_points_detected": 24,
                "axes_detected": True,
                "legend_detected": True,
                "title_detected": True,
                "quality_score": 0.85,
                "suggestions": [
                    "Consider increasing font size for better readability",
                    "Add error bars to show data uncertainty",
                    "Use more contrasting colors for accessibility"
                ]
            },
            "message": "Figure analysis completed successfully"
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions (like usage limit errors)
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Figure analysis failed: {str(e)}"
        )


@router.get("/usage")
async def get_usage_info(
    http_request: Request,
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    admin_db: Client = Depends(get_admin_db_client)
):
    """Get current usage information for figure analysis"""
    try:
        limiter = UsageLimiter(admin_db)
        user_id = current_user.id if current_user else None
        
        usage_info = await limiter.get_remaining_usage(
            http_request,
            'figure_analysis',
            user_id
        )
        
        return usage_info
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get usage information: {str(e)}"
        ) 