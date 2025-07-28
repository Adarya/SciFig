from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.services.auth import (
    get_current_user_optional, 
    get_current_user_required, 
    get_current_user_or_mock,
    AuthService, 
    AuthenticatedUser,
    MockUser,
    supabase
)
from app.core.database import get_db

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]
    expires_in: Optional[int] = 3600

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    subscription_tier: str
    subscription_status: str
    usage_limits: Dict[str, Any]

class AuthStatusResponse(BaseModel):
    authenticated: bool
    user: Optional[Dict[str, Any]] = None

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with Supabase and return access token
    """
    
    try:
        # Use Supabase to authenticate (if available)
        if supabase:
            response = supabase.auth.sign_in_with_password({
                "email": request.email,
                "password": request.password
            })
        else:
            # Fallback to mock authentication for development
            raise Exception("Supabase not available - using fallback")
        
        if response.user and response.session:
            # Create auth service and get user session
            auth_service = AuthService()
            user = await auth_service.get_user_from_token(response.session.access_token, db)
            session_data = await auth_service.create_user_session(user)
            
            return TokenResponse(
                access_token=response.session.access_token,
                token_type="bearer",
                expires_in=response.session.expires_in or 3600,
                user=session_data
            )
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except Exception as e:
        # Fallback for development - accept mock credentials
        if request.email in ["test@example.com", "dev@example.com", "mock@example.com"]:
            return TokenResponse(
                access_token="dev_mock_token_12345",
                token_type="bearer", 
                expires_in=3600,
                user={
                    "user_id": "00000000-0000-4000-8000-000000000001",
                    "email": request.email,
                    "name": "Development User",
                    "subscription_tier": "pro",
                    "subscription_status": "active",
                    "session_created": "2024-01-01T00:00:00"
                }
            )
        
        print(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """
    Create new user account with Supabase
    """
    
    try:
        # Use Supabase to create user (if available)
        if supabase:
            response = supabase.auth.sign_up({
                "email": request.email,
                "password": request.password,
                "options": {
                    "data": {
                        "name": request.name or request.email.split('@')[0]
                    }
                }
            })
        else:
            # Fallback for development
            raise Exception("Supabase not available - using fallback")
        
        if response.user:
            if response.session:
                # User was created and logged in
                auth_service = AuthService()
                user = await auth_service.get_user_from_token(response.session.access_token, db)
                session_data = await auth_service.create_user_session(user)
                
                return TokenResponse(
                    access_token=response.session.access_token,
                    token_type="bearer",
                    expires_in=response.session.expires_in or 3600,
                    user=session_data
                )
            else:
                # User created but needs email confirmation
                raise HTTPException(
                    status_code=202, 
                    detail="User created. Please check your email for confirmation."
                )
        else:
            raise HTTPException(status_code=400, detail="User creation failed")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=400, detail="Signup failed")

@router.post("/logout")
async def logout(current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional)):
    """
    Logout user (note: Supabase handles session invalidation on client side)
    """
    try:
        # In a production app, you might want to:
        # 1. Add token to blacklist
        # 2. Update user's last_logout time
        # 3. Clear any server-side session data
        
        if current_user:
            return {"message": f"User {current_user.email} logged out successfully"}
        else:
            return {"message": "Logout completed"}
            
    except Exception as e:
        print(f"Logout error: {e}")
        return {"message": "Logout completed"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: AuthenticatedUser = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user information
    """
    auth_service = AuthService()
    usage_limits = auth_service.get_usage_limits(current_user)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        subscription_tier=current_user.subscription_tier,
        subscription_status=current_user.subscription_status,
        usage_limits=usage_limits
    )

@router.get("/check", response_model=AuthStatusResponse)
async def check_auth_status(
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional)
):
    """
    Check authentication status (allows anonymous access)
    """
    if current_user:
        return AuthStatusResponse(
            authenticated=True,
            user={
                "id": current_user.id,
                "email": current_user.email,
                "name": current_user.name,
                "subscription_tier": current_user.subscription_tier,
                "subscription_status": current_user.subscription_status
            }
        )
    else:
        return AuthStatusResponse(authenticated=False)

@router.get("/session")
async def get_user_session(
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_or_mock)
):
    """
    Get user session information (works with or without auth)
    Returns development user for easier testing when not authenticated
    """
    if current_user:
        auth_service = AuthService()
        return await auth_service.create_user_session(current_user)
    else:
        return {
            "authenticated": False,
            "session_type": "anonymous",
            "user_id": None,
            "limits": {
                "analyses_per_month": 1,
                "max_file_size_mb": 10,
                "export_formats": ["png"],
                "collaboration": False
            }
        }

@router.get("/limits")
async def get_user_limits(
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_or_mock)
):
    """
    Get user usage limits based on subscription tier
    """
    if current_user:
        auth_service = AuthService()
        return {
            "user_tier": current_user.subscription_tier,
            "limits": auth_service.get_usage_limits(current_user)
        }
    else:
        # Return free tier limits for anonymous users
        return {
            "user_tier": "anonymous",
            "limits": {
                "analyses_per_month": 1,
                "max_file_size_mb": 10,
                "export_formats": ["png"],
                "collaboration": False
            }
        }

@router.get("/dev/mock-user")
async def get_mock_user_for_development():
    """
    Development endpoint - returns mock user data for testing
    """
    return {
        "access_token": "dev_mock_token_12345",
        "token_type": "bearer",
        "user": {
                                "user_id": "00000000-0000-4000-8000-000000000001",
            "email": "dev@example.com",
            "name": "Development User",
            "subscription_tier": "pro",
            "subscription_status": "active"
        }
    } 