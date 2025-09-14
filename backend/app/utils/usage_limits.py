"""Usage limits and tracking for anonymous users"""

from fastapi import HTTPException, Request, status
from supabase import Client
from typing import Optional
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)


class UsageLimiter:
    """Handle usage limits for anonymous users"""
    
    # Usage limits
    LIMITS = {
        'anonymous': {
            'statistical_analysis': 1,  # Allow only 1 statistical analysis for non-users
            'figure_analysis': 1       # Allow only 1 figure analysis for non-users
        },
        'authenticated': {
            'statistical_analysis': 3,  # Allow 3 statistical analyses for users
            'figure_analysis': 3       # Allow 3 figure analyses for users
        }
    }
    
    def __init__(self, admin_db: Client):
        self.admin_db = admin_db
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request"""
        # Check for forwarded IPs first (common in production with reverse proxies)
        forwarded_ips = request.headers.get('X-Forwarded-For')
        if forwarded_ips:
            # Take the first IP in the chain (original client)
            return forwarded_ips.split(',')[0].strip()
        
        # Check other common proxy headers
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip.strip()
        
        # Fall back to direct connection IP
        if hasattr(request, 'client') and request.client:
            return request.client.host
        
        # Default fallback
        return '127.0.0.1'
    
    async def check_and_increment_usage(
        self, 
        request: Request, 
        feature_type: str,
        user_id: Optional[str] = None
    ) -> bool:
        """
        Check if user has reached usage limit and increment count if allowed.
        Returns True if usage is allowed, False if limit reached.
        """
        if user_id:
            # Handle authenticated users
            return await self._check_user_usage(user_id, feature_type)
        else:
            # Handle anonymous users
            return await self._check_anonymous_usage(request, feature_type)
    
    async def _check_user_usage(self, user_id: str, feature_type: str) -> bool:
        """Check usage limits for authenticated users"""
        if feature_type not in self.LIMITS['authenticated']:
            logger.error(f"Invalid feature type: {feature_type}")
            return False
        
        limit = self.LIMITS['authenticated'][feature_type]
        
        try:
            # Check current usage for this user and feature
            usage_response = self.admin_db.table('user_usage').select(
                'usage_count, last_used'
            ).eq('user_id', user_id).eq('feature_type', feature_type).execute()
            
            current_time = datetime.now(timezone.utc)
            
            if usage_response.data:
                # User has existing usage record
                usage_record = usage_response.data[0]
                current_count = usage_record['usage_count']
                
                # Check if limit reached
                if current_count >= limit:
                    logger.info(f"Usage limit reached for user {user_id}, feature {feature_type}")
                    return False
                
                # Increment usage count
                self.admin_db.table('user_usage').update({
                    'usage_count': current_count + 1,
                    'last_used': current_time.isoformat()
                }).eq('user_id', user_id).eq('feature_type', feature_type).execute()
                
            else:
                # First time using this feature - create new record
                self.admin_db.table('user_usage').insert({
                    'user_id': user_id,
                    'feature_type': feature_type,
                    'usage_count': 1,
                    'first_used': current_time.isoformat(),
                    'last_used': current_time.isoformat()
                }).execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking user usage limits: {e}")
            # In case of error, allow the request but log it
            return True
    
    async def _check_anonymous_usage(self, request: Request, feature_type: str) -> bool:
        """Check usage limits for anonymous users"""
        if feature_type not in self.LIMITS['anonymous']:
            logger.error(f"Invalid feature type: {feature_type}")
            return False
        
        ip_address = self._get_client_ip(request)
        limit = self.LIMITS['anonymous'][feature_type]
        
        try:
            # Check current usage for this IP and feature
            usage_response = self.admin_db.table('anonymous_usage').select(
                'usage_count, last_used'
            ).eq('ip_address', ip_address).eq('feature_type', feature_type).execute()
            
            current_time = datetime.now(timezone.utc)
            
            if usage_response.data:
                # User has existing usage record
                usage_record = usage_response.data[0]
                current_count = usage_record['usage_count']
                last_used = datetime.fromisoformat(usage_record['last_used'].replace('Z', '+00:00'))
                
                # No daily reset - usage limits are permanent until manually reset
                
                # Check if limit reached
                if current_count >= limit:
                    logger.info(f"Usage limit reached for IP {ip_address}, feature {feature_type}")
                    return False
                # Increment usage count
                self.admin_db.table('anonymous_usage').update({
                    'usage_count': current_count + 1,
                    'last_used': current_time.isoformat()
                }).eq('ip_address', ip_address).eq('feature_type', feature_type).execute()
                
            else:
                # First time using this feature - create new record
                self.admin_db.table('anonymous_usage').insert({
                    'ip_address': ip_address,
                    'feature_type': feature_type,
                    'usage_count': 1,
                    'first_used': current_time.isoformat(),
                    'last_used': current_time.isoformat()
                }).execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking usage limits: {e}")
            # In case of error, allow the request but log it
            return True
    
    async def get_remaining_usage(
        self, 
        request: Request, 
        feature_type: str,
        user_id: Optional[str] = None
    ) -> dict:
        """Get remaining usage count for a feature"""
        if user_id:
            # Handle authenticated users
            return await self._get_user_remaining_usage(user_id, feature_type)
        else:
            # Handle anonymous users
            return await self._get_anonymous_remaining_usage(request, feature_type)
    
    async def _get_user_remaining_usage(self, user_id: str, feature_type: str) -> dict:
        """Get remaining usage count for authenticated users"""
        if feature_type not in self.LIMITS['authenticated']:
            return {'remaining': 0, 'limit': 0, 'unlimited': False}
        
        limit = self.LIMITS['authenticated'][feature_type]
        
        try:
            usage_response = self.admin_db.table('user_usage').select(
                'usage_count, last_used'
            ).eq('user_id', user_id).eq('feature_type', feature_type).execute()
            
            if not usage_response.data:
                # No usage yet
                return {'remaining': limit, 'limit': limit, 'unlimited': False}
            
            usage_record = usage_response.data[0]
            current_count = usage_record['usage_count']
            
            # No daily reset - calculate remaining based on current count
            remaining = max(0, limit - current_count)
            
            return {
                'remaining': remaining,
                'limit': limit,
                'unlimited': False
            }
            
        except Exception as e:
            logger.error(f"Error getting user usage info: {e}")
            return {'remaining': 0, 'limit': limit, 'unlimited': False}
    
    async def _get_anonymous_remaining_usage(self, request: Request, feature_type: str) -> dict:
        """Get remaining usage count for anonymous users"""
        if feature_type not in self.LIMITS['anonymous']:
            return {'remaining': 0, 'limit': 0, 'unlimited': False}
        
        ip_address = self._get_client_ip(request)
        limit = self.LIMITS['anonymous'][feature_type]
        
        try:
            usage_response = self.admin_db.table('anonymous_usage').select(
                'usage_count, last_used'
            ).eq('ip_address', ip_address).eq('feature_type', feature_type).execute()
            
            if not usage_response.data:
                # No usage yet
                return {'remaining': limit, 'limit': limit, 'unlimited': False}
            
            usage_record = usage_response.data[0]
            current_count = usage_record['usage_count']
            last_used = datetime.fromisoformat(usage_record['last_used'].replace('Z', '+00:00'))
            current_time = datetime.now(timezone.utc)
            
            # No daily reset - calculate remaining based on current count
            remaining = max(0, limit - current_count)
            
            return {
                'remaining': remaining,
                'limit': limit,
                'unlimited': False
            }
            
        except Exception as e:
            logger.error(f"Error getting usage info: {e}")
            return {'remaining': 0, 'limit': limit, 'unlimited': False}


def require_usage_limit(feature_type: str):
    """Decorator to enforce usage limits on endpoints"""
    
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract request and admin_db from the function arguments
            request = None
            admin_db = None
            user = None
            
            # Find request, admin_db, and user in the function arguments
            for arg in args:
                if hasattr(arg, 'method') and hasattr(arg, 'url'):  # FastAPI Request
                    request = arg
                elif hasattr(arg, 'table'):  # Supabase Client
                    admin_db = arg
            
            # Look for user in kwargs (from get_optional_user dependency)
            if 'current_user' in kwargs:
                user = kwargs['current_user']
            
            if not request:
                # If we can't find request, skip the check (shouldn't happen in normal usage)
                return await func(*args, **kwargs)
            
            if not admin_db:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database connection not available"
                )
            
            limiter = UsageLimiter(admin_db)
            user_id = user.id if user else None
            
            # Check usage limit
            allowed = await limiter.check_and_increment_usage(request, feature_type, user_id)
            
            if not allowed:
                limit = limiter.LIMITS.get(feature_type, 0)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Usage limit exceeded. Anonymous users are limited to {limit} {feature_type.replace('_', ' ')} per day. Please sign up for unlimited access."
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator 