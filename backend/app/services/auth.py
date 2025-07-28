"""
Authentication service for SciFig AI
Real Supabase integration with database user synchronization
"""

from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import jwt
from datetime import datetime
from supabase import create_client, Client
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

# Simple auth service that allows both authenticated and anonymous usage
security = HTTPBearer(auto_error=False)

# Initialize Supabase client (with fallback for development)
try:
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
except Exception as e:
    print(f"Warning: Supabase initialization failed: {e}")
    supabase = None


class AuthenticatedUser:
    """Authenticated user with database backing"""
    def __init__(self, id: str, email: str, name: str = None, 
                 subscription_tier: str = "free", subscription_status: str = "active"):
        self.id = id
        self.email = email
        self.name = name or "User"
        self.subscription_tier = subscription_tier
        self.subscription_status = subscription_status
        self.created_at = datetime.utcnow()


class MockUser:
    """Mock user for testing and anonymous access"""
    def __init__(self, id: str = "anonymous", email: str = "anonymous@example.com"):
        self.id = id
        self.email = email
        self.name = "Anonymous User"
        self.subscription_tier = "free"
        self.subscription_status = "active"


async def verify_supabase_token(token: str) -> Dict[str, Any]:
    """
    Verify a Supabase JWT token and return the payload.
    """
    try:
        # Option 1: Use Supabase client to verify token
        if supabase:
            try:
                response = supabase.auth.get_user(token)
                if response.user:
                    return {
                        "sub": response.user.id,
                        "email": response.user.email,
                        "user_metadata": response.user.user_metadata or {},
                        "app_metadata": response.user.app_metadata or {},
                        "verified": True
                    }
            except Exception as supabase_error:
                print(f"Supabase auth error: {supabase_error}")
            
        # Option 2: Manual JWT verification (fallback)
        # For development, we'll be more lenient
        if settings.PROJECT_NAME == "SciFig AI API":  # Development mode
            try:
                payload = jwt.decode(
                    token, 
                    options={"verify_signature": False}  # Development only
                )
                return payload
            except Exception:
                pass
        
        # Option 3: Use service key for verification
        try:
            jwt_secret = settings.SUPABASE_SERVICE_KEY
            if jwt_secret:
                payload = jwt.decode(
                    token, 
                    jwt_secret, 
                    algorithms=["HS256"]
                )
                return payload
        except Exception:
            pass
            
        raise HTTPException(status_code=401, detail="Invalid token")
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_or_create_user_in_db(db: Session, user_id: str, email: str, name: str = None) -> 'User':
    """Get or create user in database"""
    from app.services.database_service import UserService
    
    # Try to get existing user
    db_user = UserService.get_user_by_id(db, user_id)
    if not db_user:
        # Try by email (in case user exists but with different ID)
        db_user = UserService.get_user_by_email(db, email)
        if db_user:
            # Update the user ID to match Supabase
            db_user = UserService.update_user(db, db_user.id, id=user_id)
        else:
            # Create new user
            db_user = UserService.create_user(
                db, 
                email=email, 
                name=name,
                id=user_id  # Pass the user_id for the mock user
            )
    else:
        # Update last login
        UserService.update_last_login(db, user_id)
    
    return db_user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[AuthenticatedUser]:
    """
    Get current user from token, but allow anonymous access
    Returns None for anonymous users
    """
    
    if not credentials:
        return None
    
    try:
        # Verify the JWT token
        payload = await verify_supabase_token(credentials.credentials)
        
        # Get user info from payload
        user_id = payload.get("sub")
        email = payload.get("email")
        user_metadata = payload.get("user_metadata", {})
        name = user_metadata.get("name") or user_metadata.get("full_name")
        
        if not user_id or not email:
            return None
        
        # Get or create user in our database
        try:
            db_user = await get_or_create_user_in_db(db, user_id, email, name)
            
            return AuthenticatedUser(
                id=str(db_user.id),
                email=db_user.email,
                name=db_user.name,
                subscription_tier=db_user.subscription_tier,
                subscription_status=db_user.subscription_status
            )
        except Exception as db_error:
            print(f"Database error during auth: {db_error}")
            # Return user without database backing as fallback
            return AuthenticatedUser(
                id=user_id,
                email=email,
                name=name or email.split('@')[0]
            )
            
    except HTTPException:
        return None
    except Exception as e:
        print(f"Authentication error: {e}")
        return None


async def get_current_user_required(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> AuthenticatedUser:
    """
    Get current user from token, require authentication
    Raises HTTPException if not authenticated
    
    In development mode, returns mock user if no credentials provided
    """
    
    # Development mode bypass - return mock user if no credentials
    if settings.PROJECT_NAME == "SciFig AI API":  # Development mode
        if not credentials:
            print("🔓 Development mode: Using mock user for authentication bypass")
            # Return a simple mock user for development - use the user ID from the created project
            return AuthenticatedUser(
                id="82dbb907-fe55-47db-9e99-3d0a379ed571",  # Use the actual user ID from created project
                email="dev@example.com",
                name="Development User",
                subscription_tier="pro",
                subscription_status="active"
            )
    
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user = await get_current_user_optional(credentials, db)
    if not user:
        # In development mode, return mock user as fallback
        if settings.PROJECT_NAME == "SciFig AI API":
            print("🔓 Development mode: Invalid token, using mock user fallback")
            # Return a simple mock user for development
            return AuthenticatedUser(
                id="82dbb907-fe55-47db-9e99-3d0a379ed571",  # Use the actual user ID from created project
                email="dev@example.com",
                name="Development User",
                subscription_tier="pro",
                subscription_status="active"
            )
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    return user


# Mock functions for development and testing
async def get_mock_user() -> MockUser:
    """Development fallback - returns a mock user for testing"""
    return MockUser(id="00000000-0000-4000-8000-000000000001", email="dev@example.com")


async def get_current_user_or_mock(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[AuthenticatedUser]:
    """
    Get current user or return mock user in development mode
    Useful for endpoints that work better with a user but don't require auth
    """
    user = await get_current_user_optional(credentials, db)
    
    if not user and settings.PROJECT_NAME == "SciFig AI API":  # Development mode
        # Return a mock user for easier development
        return AuthenticatedUser(
            id="82dbb907-fe55-47db-9e99-3d0a379ed571",  # Use the actual user ID from created project
            email="dev@example.com",
            name="Development User",
            subscription_tier="pro",
            subscription_status="active"
        )
    
    return user


class AuthService:
    """Enhanced authentication service with real Supabase integration"""
    
    def __init__(self):
        self.supabase = supabase
    
    async def validate_token(self, token: str) -> dict:
        """Validate authentication token"""
        try:
            return await verify_supabase_token(token)
        except Exception as e:
            raise HTTPException(status_code=401, detail=str(e))
    
    async def get_user_from_token(self, token: str, db: Session) -> AuthenticatedUser:
        """Get user information from valid token"""
        payload = await self.validate_token(token)
        
        # Extract user info from token payload
        user_id = payload.get("sub")
        email = payload.get("email")
        user_metadata = payload.get("user_metadata", {})
        name = user_metadata.get("name") or user_metadata.get("full_name")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Get or create user in database
        db_user = await get_or_create_user_in_db(db, user_id, email, name)
        
        return AuthenticatedUser(
            id=str(db_user.id),
            email=db_user.email,
            name=db_user.name,
            subscription_tier=db_user.subscription_tier,
            subscription_status=db_user.subscription_status
        )
    
    def check_subscription_access(self, user: AuthenticatedUser, feature: str) -> bool:
        """Check if user has access to specific features based on subscription"""
        
        # Free tier limitations
        if user.subscription_tier == "free":
            free_features = ["basic_analysis", "file_upload", "figure_generation"]
            return feature in free_features
        
        # Pro tier has access to most features
        elif user.subscription_tier == "pro":
            return True
        
        # Enterprise has access to everything
        elif user.subscription_tier == "enterprise":
            return True
        
        return False
    
    def get_usage_limits(self, user: AuthenticatedUser) -> dict:
        """Get usage limits for user based on subscription tier"""
        
        limits = {
            "free": {
                "analyses_per_month": 5,
                "max_file_size_mb": 50,
                "export_formats": ["png"],
                "collaboration": False
            },
            "pro": {
                "analyses_per_month": -1,  # Unlimited
                "max_file_size_mb": 200,
                "export_formats": ["png", "svg", "pdf", "eps"],
                "collaboration": True
            },
            "enterprise": {
                "analyses_per_month": -1,  # Unlimited
                "max_file_size_mb": 500,
                "export_formats": ["png", "svg", "pdf", "eps"],
                "collaboration": True,
                "api_access": True,
                "priority_support": True
            }
        }
        
        return limits.get(user.subscription_tier, limits["free"])
    
    async def create_user_session(self, user: AuthenticatedUser) -> dict:
        """Create user session data"""
        return {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "subscription_tier": user.subscription_tier,
            "subscription_status": user.subscription_status,
            "limits": self.get_usage_limits(user),
            "session_created": datetime.utcnow().isoformat()
        } 