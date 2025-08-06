"""Authentication routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import List

from ..config.database import get_db_client, get_admin_db_client
from .models import (
    UserCreate, UserLogin, UserResponse, UserUpdate, 
    Token, PasswordReset, PasswordUpdate
)
from .dependencies import get_current_active_user, require_admin

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/signup", response_model=UserResponse)
async def signup(
    user_data: UserCreate,
    db: Client = Depends(get_db_client),
    admin_db: Client = Depends(get_admin_db_client)
):
    """Register a new user"""
    try:
        # Create user with Supabase Auth
        auth_response = db.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name,
                    "organization": user_data.organization
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User registration failed"
            )
        
        # Create user profile in our custom users table using admin client
        profile_data = {
            'id': auth_response.user.id,
            'email': user_data.email,
            'full_name': user_data.full_name,
            'organization': user_data.organization,
            'role': 'user'
        }
        
        profile_response = admin_db.table('users').insert(profile_data).execute()
        user_profile = profile_response.data[0]
        
        return UserResponse(
            id=user_profile['id'],
            email=user_profile['email'],
            full_name=user_profile.get('full_name'),
            role=user_profile['role'],
            organization=user_profile.get('organization'),
            is_active=user_profile['is_active'],
            created_at=user_profile['created_at'],
            updated_at=user_profile['updated_at']
        )
        
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    db: Client = Depends(get_db_client)
):
    """Login user and return access token"""
    try:
        # Authenticate with Supabase
        auth_response = db.auth.sign_in_with_password({
            "email": user_credentials.email,
            "password": user_credentials.password
        })
        
        if not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        return Token(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            token_type="bearer",
            expires_in=auth_response.session.expires_in or 3600
        )
        
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: Client = Depends(get_db_client)
):
    """Refresh access token"""
    try:
        auth_response = db.auth.refresh_session(refresh_token)
        
        if not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        return Token(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            token_type="bearer",
            expires_in=auth_response.session.expires_in or 3600
        )
        
    except Exception as e:
        print(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refresh failed"
        )


@router.get("/check", response_model=UserResponse)
async def check_auth(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Check if user is authenticated and return user info"""
    return current_user


@router.post("/logout")
async def logout(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_db_client)
):
    """Logout current user"""
    try:
        db.auth.sign_out()
        return {"message": "Successfully logged out"}
    except Exception as e:
        print(f"Logout error: {e}")
        return {"message": "Logout completed"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get current user profile"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_db_client)
):
    """Update current user profile"""
    try:
        update_data = {k: v for k, v in user_update.dict().items() if v is not None}
        update_data['updated_at'] = 'NOW()'
        
        response = db.table('users').update(update_data).eq('id', current_user.id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_profile = response.data[0]
        
        return UserResponse(
            id=user_profile['id'],
            email=user_profile['email'],
            full_name=user_profile.get('full_name'),
            role=user_profile['role'],
            organization=user_profile.get('organization'),
            is_active=user_profile['is_active'],
            created_at=user_profile['created_at'],
            updated_at=user_profile['updated_at']
        )
        
    except Exception as e:
        print(f"User update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile update failed"
        )


@router.post("/forgot-password")
async def forgot_password(
    password_reset: PasswordReset,
    db: Client = Depends(get_db_client)
):
    """Send password reset email"""
    try:
        db.auth.reset_password_email(password_reset.email)
        return {"message": "Password reset email sent"}
    except Exception as e:
        print(f"Password reset error: {e}")
        # Don't reveal if email exists or not
        return {"message": "If the email exists, a password reset link has been sent"}


@router.put("/change-password")
async def change_password(
    password_update: PasswordUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_db_client)
):
    """Change user password"""
    try:
        # Verify current password by attempting to sign in
        try:
            auth_response = db.auth.sign_in_with_password({
                "email": current_user.email,
                "password": password_update.current_password
            })
            if not auth_response.user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current password is incorrect"
                )
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        db.auth.update_user({"password": password_update.new_password})
        
        return {"message": "Password updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Password change error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password change failed"
        )


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    current_user: UserResponse = Depends(require_admin),
    db: Client = Depends(get_admin_db_client)
):
    """List all users (admin only)"""
    try:
        response = db.table('users').select('*').execute()
        
        users = []
        for user_data in response.data:
            users.append(UserResponse(
                id=user_data['id'],
                email=user_data['email'],
                full_name=user_data.get('full_name'),
                role=user_data['role'],
                organization=user_data.get('organization'),
                is_active=user_data['is_active'],
                created_at=user_data['created_at'],
                updated_at=user_data['updated_at']
            ))
        
        return users
        
    except Exception as e:
        print(f"List users error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users"
        )


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: UserResponse = Depends(require_admin),
    db: Client = Depends(get_admin_db_client)
):
    """Update user (admin only)"""
    try:
        update_data = {k: v for k, v in user_update.dict().items() if v is not None}
        update_data['updated_at'] = 'NOW()'
        
        response = db.table('users').update(update_data).eq('id', user_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_profile = response.data[0]
        
        return UserResponse(
            id=user_profile['id'],
            email=user_profile['email'],
            full_name=user_profile.get('full_name'),
            role=user_profile['role'],
            organization=user_profile.get('organization'),
            is_active=user_profile['is_active'],
            created_at=user_profile['created_at'],
            updated_at=user_profile['updated_at']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Admin user update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User update failed"
        ) 