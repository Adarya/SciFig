"""Admin panel routes"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import Client
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from ..config.database import get_admin_db_client, get_db_client
from ..auth.dependencies import require_admin, get_current_active_user
from ..auth.models import UserResponse, UserRole
from .models import (
    UsageUpdate, UserUsageResponse, SystemStats, UserCreateAdmin,
    AnonymousUsageResponse, AdminAnalyticsResponse
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=SystemStats)
async def get_system_stats(
    current_user: UserResponse = Depends(require_admin),
    admin_db: Client = Depends(get_admin_db_client)
):
    """Get system statistics for admin dashboard"""
    try:
        # Get user statistics
        users_response = admin_db.table('users').select('id, created_at, updated_at').execute()
        total_users = len(users_response.data)
        
        # Active users (updated in last 24 hours)
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        active_today_response = admin_db.table('users').select('id').gte('updated_at', yesterday).execute()
        active_users_today = len(active_today_response.data)
        
        # Active users (updated in last week)
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        active_week_response = admin_db.table('users').select('id').gte('updated_at', week_ago).execute()
        active_users_week = len(active_week_response.data)
        
        # Analysis statistics
        analyses_response = admin_db.table('user_usage').select('usage_count').execute()
        total_analyses = sum(record['usage_count'] for record in analyses_response.data)
        
        # Today's analyses
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        today_analyses_response = admin_db.table('user_usage').select('usage_count').gte('last_used', today_start).execute()
        analyses_today = sum(record['usage_count'] for record in today_analyses_response.data)
        
        # Week's analyses
        week_analyses_response = admin_db.table('user_usage').select('usage_count').gte('last_used', week_ago).execute()
        analyses_week = sum(record['usage_count'] for record in week_analyses_response.data)
        
        return SystemStats(
            total_users=total_users,
            active_users_today=active_users_today,
            active_users_week=active_users_week,
            total_analyses=total_analyses,
            analyses_today=analyses_today,
            analyses_week=analyses_week,
            total_storage_gb=0.0,  # Placeholder - implement based on your storage tracking
            api_calls_today=0,     # Placeholder - implement based on your API call tracking
            system_health=99.5
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system stats: {str(e)}"
        )


@router.get("/users/usage", response_model=List[UserUsageResponse])
async def get_users_usage(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(require_admin),
    admin_db: Client = Depends(get_admin_db_client)
):
    """Get usage information for all users"""
    try:
        offset = (page - 1) * limit
        
        # Get users with their usage data
        users_response = admin_db.table('users').select('*').range(offset, offset + limit - 1).execute()
        
        usage_data = []
        for user in users_response.data:
            # Get user's statistical analysis usage
            stat_usage_response = admin_db.table('user_usage').select('*').eq(
                'user_id', user['id']
            ).eq('feature_type', 'statistical_analysis').execute()
            
            stat_used = stat_usage_response.data[0]['usage_count'] if stat_usage_response.data else 0
            stat_limit = 3  # Default limit for authenticated users
            
            # Get user's figure analysis usage
            fig_usage_response = admin_db.table('user_usage').select('*').eq(
                'user_id', user['id']
            ).eq('feature_type', 'figure_analysis').execute()
            
            fig_used = fig_usage_response.data[0]['usage_count'] if fig_usage_response.data else 0
            fig_limit = 3  # Default limit for authenticated users
            
            # Get last activity
            last_activity = None
            if stat_usage_response.data or fig_usage_response.data:
                activity_times = []
                if stat_usage_response.data:
                    activity_times.append(datetime.fromisoformat(stat_usage_response.data[0]['last_used'].replace('Z', '+00:00')))
                if fig_usage_response.data:
                    activity_times.append(datetime.fromisoformat(fig_usage_response.data[0]['last_used'].replace('Z', '+00:00')))
                
                if activity_times:
                    last_activity = max(activity_times)
            
            usage_data.append(UserUsageResponse(
                user_id=user['id'],
                user_email=user['email'],
                user_name=user.get('full_name'),
                user_role=user['role'],
                statistical_analysis_used=stat_used,
                statistical_analysis_limit=stat_limit,
                figure_analysis_used=fig_used,
                figure_analysis_limit=fig_limit,
                last_activity=last_activity,
                is_unlimited=user['role'] in ['admin', 'researcher']
            ))
        
        return usage_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user usage data: {str(e)}"
        )


@router.put("/users/{user_id}/usage")
async def update_user_usage(
    user_id: str,
    usage_update: UsageUpdate,
    current_user: UserResponse = Depends(require_admin),
    admin_db: Client = Depends(get_admin_db_client)
):
    """Update user usage limits"""
    try:
        # Check if user exists
        user_response = admin_db.table('users').select('*').eq('id', user_id).execute()
        if not user_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update statistical analysis usage if specified
        if usage_update.statistical_analysis is not None:
            admin_db.table('user_usage').upsert({
                'user_id': user_id,
                'feature_type': 'statistical_analysis',
                'usage_count': 0,  # Reset usage count when admin updates limits
                'last_used': datetime.now(timezone.utc).isoformat()
            }).execute()
        
        # Update figure analysis usage if specified
        if usage_update.figure_analysis is not None:
            admin_db.table('user_usage').upsert({
                'user_id': user_id,
                'feature_type': 'figure_analysis',
                'usage_count': 0,  # Reset usage count when admin updates limits
                'last_used': datetime.now(timezone.utc).isoformat()
            }).execute()
        
        return {"message": "User usage limits updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user usage: {str(e)}"
        )


@router.post("/users/{user_id}/reset-usage")
async def reset_user_usage(
    user_id: str,
    feature_type: Optional[str] = Query(None, regex="^(statistical_analysis|figure_analysis)$"),
    current_user: UserResponse = Depends(require_admin),
    admin_db: Client = Depends(get_admin_db_client)
):
    """Reset user usage counts"""
    try:
        # Check if user exists
        user_response = admin_db.table('users').select('*').eq('id', user_id).execute()
        if not user_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if feature_type:
            # Reset specific feature usage
            admin_db.table('user_usage').update({
                'usage_count': 0,
                'last_used': datetime.now(timezone.utc).isoformat()
            }).eq('user_id', user_id).eq('feature_type', feature_type).execute()
        else:
            # Reset all usage
            admin_db.table('user_usage').update({
                'usage_count': 0,
                'last_used': datetime.now(timezone.utc).isoformat()
            }).eq('user_id', user_id).execute()
        
        return {"message": "User usage reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset user usage: {str(e)}"
        )


@router.get("/anonymous-usage", response_model=List[AnonymousUsageResponse])
async def get_anonymous_usage(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(require_admin),
    admin_db: Client = Depends(get_admin_db_client)
):
    """Get anonymous usage statistics"""
    try:
        offset = (page - 1) * limit
        
        response = admin_db.table('anonymous_usage').select('*').range(offset, offset + limit - 1).execute()
        
        usage_data = []
        for usage in response.data:
            usage_data.append(AnonymousUsageResponse(
                ip_address=usage['ip_address'],
                statistical_analysis_used=usage['usage_count'] if usage['feature_type'] == 'statistical_analysis' else 0,
                figure_analysis_used=usage['usage_count'] if usage['feature_type'] == 'figure_analysis' else 0,
                first_used=datetime.fromisoformat(usage['first_used'].replace('Z', '+00:00')),
                last_used=datetime.fromisoformat(usage['last_used'].replace('Z', '+00:00'))
            ))
        
        return usage_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get anonymous usage data: {str(e)}"
        )


@router.post("/users", response_model=UserResponse)
async def create_user_admin(
    user_data: UserCreateAdmin,
    current_user: UserResponse = Depends(require_admin),
    db: Client = Depends(get_db_client),
    admin_db: Client = Depends(get_admin_db_client)
):
    """Create a new user (admin only)"""
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
            'role': user_data.role
        }
        
        profile_response = admin_db.table('users').upsert(profile_data).execute()
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
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User creation failed: {str(e)}"
        )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: UserResponse = Depends(require_admin),
    admin_db: Client = Depends(get_admin_db_client)
):
    """Delete a user (admin only)"""
    try:
        # Check if user exists
        user_response = admin_db.table('users').select('*').eq('id', user_id).execute()
        if not user_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete user profile (cascading will handle related data)
        admin_db.table('users').delete().eq('id', user_id).execute()
        
        return {"message": "User deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )


@router.get("/analytics", response_model=AdminAnalyticsResponse)
async def get_admin_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: UserResponse = Depends(require_admin),
    admin_db: Client = Depends(get_admin_db_client)
):
    """Get admin analytics data"""
    try:
        # Daily signups for the past N days
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        users_response = admin_db.table('users').select('created_at').gte('created_at', start_date.isoformat()).execute()
        
        # Group by date
        daily_signups = {}
        for user in users_response.data:
            date = datetime.fromisoformat(user['created_at'].replace('Z', '+00:00')).date()
            daily_signups[str(date)] = daily_signups.get(str(date), 0) + 1
        
        # Daily analyses
        usage_response = admin_db.table('user_usage').select('last_used, usage_count').gte('last_used', start_date.isoformat()).execute()
        daily_analyses = {}
        for usage in usage_response.data:
            date = datetime.fromisoformat(usage['last_used'].replace('Z', '+00:00')).date()
            daily_analyses[str(date)] = daily_analyses.get(str(date), 0) + usage['usage_count']
        
        # Role distribution
        all_users_response = admin_db.table('users').select('role').execute()
        role_distribution = {}
        for user in all_users_response.data:
            role = user['role']
            role_distribution[role] = role_distribution.get(role, 0) + 1
        
        # Top organizations
        org_response = admin_db.table('users').select('organization').execute()
        org_count = {}
        for user in org_response.data:
            org = user.get('organization', 'Unknown')
            if org:
                org_count[org] = org_count.get(org, 0) + 1
        
        top_organizations = [{"name": org, "count": count} for org, count in sorted(org_count.items(), key=lambda x: x[1], reverse=True)[:10]]
        
        # Usage by feature
        feature_usage_response = admin_db.table('user_usage').select('feature_type, usage_count').execute()
        usage_by_feature = {}
        for usage in feature_usage_response.data:
            feature = usage['feature_type']
            usage_by_feature[feature] = usage_by_feature.get(feature, 0) + usage['usage_count']
        
        return AdminAnalyticsResponse(
            daily_signups=[{"date": date, "count": count} for date, count in daily_signups.items()],
            daily_analyses=[{"date": date, "count": count} for date, count in daily_analyses.items()],
            role_distribution=role_distribution,
            top_organizations=top_organizations,
            usage_by_feature=usage_by_feature
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics data: {str(e)}"
        ) 