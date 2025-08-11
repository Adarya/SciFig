"""Authentication dependencies"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from supabase import Client
from typing import Optional
import httpx

from ..config.settings import settings
from ..config.database import get_db_client, get_admin_db_client, get_authenticated_db_client
from .models import TokenData, UserResponse, UserRole


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db_client),
    admin_db: Client = Depends(get_admin_db_client)
) -> UserResponse:
    """Get current authenticated user"""
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        
        # Verify token with Supabase
        user_response = db.auth.get_user(token)
        
        if not user_response.user:
            raise credentials_exception
            
        supabase_user = user_response.user
        
        # Get user profile from our custom users table using admin client to bypass RLS
        profile_response = admin_db.table('users').select('*').eq('id', supabase_user.id).execute()
        
        if not profile_response.data:
            # Create user profile if it doesn't exist using admin client (upsert to handle race conditions)
            # Extract full name from various possible fields in Google OAuth
            full_name = (
                supabase_user.user_metadata.get('full_name') or 
                supabase_user.user_metadata.get('name') or 
                supabase_user.user_metadata.get('display_name') or
                None
            )
            
            profile_data = {
                'id': supabase_user.id,
                'email': supabase_user.email,
                'full_name': full_name,
                'role': 'user'
            }
            
            try:
                # Use upsert to handle race conditions during OAuth
                create_response = admin_db.table('users').upsert(profile_data).execute()
                user_profile = create_response.data[0]
            except Exception as e:
                # If upsert fails, try to fetch existing user (fallback for edge cases)
                print(f"Upsert failed, attempting to fetch existing user: {e}")
                retry_response = admin_db.table('users').select('*').eq('id', supabase_user.id).execute()
                if retry_response.data:
                    user_profile = retry_response.data[0]
                else:
                    print(f"Authentication error: {e}")
                    raise credentials_exception
        else:
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
        
    except JWTError:
        raise credentials_exception
    except Exception as e:
        print(f"Authentication error: {e}")
        raise credentials_exception


async def get_current_active_user(
    current_user: UserResponse = Depends(get_current_user)
) -> UserResponse:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def get_user_authenticated_db_client(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Client:
    """Get database client authenticated with user's token for RLS operations"""
    return get_authenticated_db_client(credentials.credentials)


def require_role(required_roles: list[UserRole]):
    """Decorator to require specific user roles"""
    
    def role_checker(current_user: UserResponse = Depends(get_current_active_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    
    return role_checker


# Common role requirements
require_admin = require_role([UserRole.ADMIN])
require_researcher = require_role([UserRole.ADMIN, UserRole.RESEARCHER])
require_analyst = require_role([UserRole.ADMIN, UserRole.RESEARCHER, UserRole.ANALYST])


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Client = Depends(get_db_client),
    admin_db: Client = Depends(get_admin_db_client)
) -> Optional[UserResponse]:
    """Get current user if authenticated, otherwise None"""
    
    if not credentials:
        return None
        
    try:
        return await get_current_user(credentials, db, admin_db)
    except HTTPException:
        return None 