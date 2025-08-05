"""Authentication models"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User roles enumeration"""
    ADMIN = "admin"
    RESEARCHER = "researcher" 
    ANALYST = "analyst"
    USER = "user"


class UserCreate(BaseModel):
    """User creation model"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: Optional[str] = None
    organization: Optional[str] = None


class UserUpdate(BaseModel):
    """User update model"""
    full_name: Optional[str] = None
    organization: Optional[str] = None
    role: Optional[UserRole] = None


class UserResponse(BaseModel):
    """User response model"""
    id: str
    email: str
    full_name: Optional[str] = None
    role: UserRole
    organization: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Token response model"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    """Token data model"""
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None


class PasswordReset(BaseModel):
    """Password reset request model"""
    email: EmailStr


class PasswordUpdate(BaseModel):
    """Password update model"""
    current_password: str
    new_password: str = Field(..., min_length=8) 