"""Admin panel models"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

from ..auth.models import UserResponse


class UsageUpdate(BaseModel):
    """Model for updating user usage limits"""
    statistical_analysis: Optional[int] = Field(None, ge=0, description="Statistical analysis limit (-1 for unlimited)")
    figure_analysis: Optional[int] = Field(None, ge=0, description="Figure analysis limit (-1 for unlimited)")


class UserUsageResponse(BaseModel):
    """User usage information response"""
    user_id: str
    user_email: str
    user_name: Optional[str]
    user_role: str
    statistical_analysis_used: int
    statistical_analysis_limit: int
    figure_analysis_used: int
    figure_analysis_limit: int
    last_activity: Optional[datetime]
    is_unlimited: bool = False


class SystemStats(BaseModel):
    """System statistics for admin dashboard"""
    total_users: int
    active_users_today: int
    active_users_week: int
    total_analyses: int
    analyses_today: int
    analyses_week: int
    total_storage_gb: float
    api_calls_today: int
    system_health: float = 99.0


class UserCreateAdmin(BaseModel):
    """Admin user creation model"""
    email: str
    password: str
    full_name: Optional[str] = None
    organization: Optional[str] = None
    role: str = Field(..., pattern="^(admin|researcher|analyst|user)$")


class AnonymousUsageResponse(BaseModel):
    """Anonymous usage response"""
    ip_address: str
    statistical_analysis_used: int
    figure_analysis_used: int
    first_used: datetime
    last_used: datetime


class AdminAnalyticsResponse(BaseModel):
    """Admin analytics data"""
    daily_signups: List[Dict[str, Any]]
    daily_analyses: List[Dict[str, Any]]
    role_distribution: Dict[str, int]
    top_organizations: List[Dict[str, Any]]
    usage_by_feature: Dict[str, int] 