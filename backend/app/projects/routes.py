"""Project and analysis routes"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import Client
from typing import List, Optional
import json
from datetime import datetime

from ..config.database import get_db_client
from ..auth.dependencies import get_current_active_user
from ..auth.models import UserResponse
from .models import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse,
    ProjectStats, AnalysisCreate, AnalysisUpdate, AnalysisResponse,
    AnalysisListResponse
)

router = APIRouter(prefix="/projects", tags=["projects"])


# =====================================
# Project Routes
# =====================================

@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_db_client)
):
    """List user's projects with pagination and optional search"""
    try:
        # Calculate offset
        offset = (page - 1) * limit
        
        # Build query
        query = db.table('projects').select(
            'id, name, description, study_type, created_at, updated_at, is_shared, user_id'
        ).eq('user_id', current_user.id)
        
        # Add search filter if provided
        if search:
            query = query.ilike('name', f'%{search}%')
        
        # Get total count for pagination
        count_response = query.execute()
        total = len(count_response.data) if count_response.data else 0
        
        # Get paginated results
        response = query.range(offset, offset + limit - 1).order('created_at', desc=True).execute()
        
        projects = []
        for project in response.data:
            # Get counts for datasets and analyses
            datasets_count = 0
            analyses_count = 0
            
            try:
                # Count datasets in this project (assuming datasets have project_id)
                dataset_response = db.table('datasets').select('id').eq('user_id', current_user.id).execute()
                datasets_count = len(dataset_response.data) if dataset_response.data else 0
                
                # Count analyses in this project
                analysis_response = db.table('analyses').select('id').eq('project_id', project['id']).execute()
                analyses_count = len(analysis_response.data) if analysis_response.data else 0
            except:
                pass  # Continue even if counts fail
            
            projects.append(ProjectResponse(
                id=project['id'],
                name=project['name'],
                description=project.get('description'),
                study_type=project.get('study_type'),
                created_at=project['created_at'],
                updated_at=project['updated_at'],
                is_shared=project['is_shared'],
                user_id=project['user_id'],
                datasets_count=datasets_count,
                analyses_count=analyses_count
            ))
        
        return ProjectListResponse(
            projects=projects,
            total=total,
            page=page,
            limit=limit,
            has_next=offset + limit < total,
            has_prev=page > 1
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects: {str(e)}"
        )


@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_db_client)
):
    """Create a new project"""
    try:
        project_dict = {
            'name': project_data.name,
            'description': project_data.description,
            'study_type': project_data.study_type,
            'is_shared': project_data.is_shared,
            'user_id': current_user.id
        }
        
        response = db.table('projects').insert(project_dict).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create project"
            )
        
        project = response.data[0]
        
        return ProjectResponse(
            id=project['id'],
            name=project['name'],
            description=project.get('description'),
            study_type=project.get('study_type'),
            created_at=project['created_at'],
            updated_at=project['updated_at'],
            is_shared=project['is_shared'],
            user_id=project['user_id'],
            datasets_count=0,
            analyses_count=0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_db_client)
):
    """Get a specific project by ID"""
    try:
        response = db.table('projects').select(
            'id, name, description, study_type, created_at, updated_at, is_shared, user_id'
        ).eq('id', project_id).eq('user_id', current_user.id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        project = response.data[0]
        
        # Get counts
        datasets_count = 0
        analyses_count = 0
        
        try:
            dataset_response = db.table('datasets').select('id').eq('user_id', current_user.id).execute()
            datasets_count = len(dataset_response.data) if dataset_response.data else 0
            
            analysis_response = db.table('analyses').select('id').eq('project_id', project_id).execute()
            analyses_count = len(analysis_response.data) if analysis_response.data else 0
        except:
            pass
        
        return ProjectResponse(
            id=project['id'],
            name=project['name'],
            description=project.get('description'),
            study_type=project.get('study_type'),
            created_at=project['created_at'],
            updated_at=project['updated_at'],
            is_shared=project['is_shared'],
            user_id=project['user_id'],
            datasets_count=datasets_count,
            analyses_count=analyses_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project: {str(e)}"
        )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_db_client)
):
    """Update a project"""
    try:
        # Check if project exists and belongs to user
        check_response = db.table('projects').select('id').eq('id', project_id).eq('user_id', current_user.id).execute()
        
        if not check_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Build update data
        update_data = {}
        if project_update.name is not None:
            update_data['name'] = project_update.name
        if project_update.description is not None:
            update_data['description'] = project_update.description
        if project_update.study_type is not None:
            update_data['study_type'] = project_update.study_type
        if project_update.is_shared is not None:
            update_data['is_shared'] = project_update.is_shared
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        response = db.table('projects').update(update_data).eq('id', project_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update project"
            )
        
        project = response.data[0]
        
        return ProjectResponse(
            id=project['id'],
            name=project['name'],
            description=project.get('description'),
            study_type=project.get('study_type'),
            created_at=project['created_at'],
            updated_at=project['updated_at'],
            is_shared=project['is_shared'],
            user_id=project['user_id'],
            datasets_count=0,
            analyses_count=0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}"
        )


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_db_client)
):
    """Delete a project"""
    try:
        # Check if project exists and belongs to user
        check_response = db.table('projects').select('id').eq('id', project_id).eq('user_id', current_user.id).execute()
        
        if not check_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Delete the project (analyses will be cascaded due to foreign key)
        response = db.table('projects').delete().eq('id', project_id).execute()
        
        return {"message": "Project deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}"
        )


@router.get("/{project_id}/stats", response_model=ProjectStats)
async def get_project_stats(
    project_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_db_client)
):
    """Get project statistics"""
    try:
        # Check if project exists and belongs to user
        project_response = db.table('projects').select('created_at, updated_at').eq('id', project_id).eq('user_id', current_user.id).execute()
        
        if not project_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        project = project_response.data[0]
        
        # Count datasets (assuming user's datasets can be associated with projects)
        datasets_count = 0
        try:
            dataset_response = db.table('datasets').select('id').eq('user_id', current_user.id).execute()
            datasets_count = len(dataset_response.data) if dataset_response.data else 0
        except:
            pass
        
        # Count analyses
        analyses_count = 0
        try:
            analysis_response = db.table('analyses').select('id').eq('project_id', project_id).execute()
            analyses_count = len(analysis_response.data) if analysis_response.data else 0
        except:
            pass
        
        # Count figures (sum from analyses)
        figures_count = 0
        try:
            analysis_figures_response = db.table('analyses').select('figures').eq('project_id', project_id).execute()
            for analysis in analysis_figures_response.data:
                if analysis.get('figures'):
                    figures_count += len(analysis['figures'])
        except:
            pass
        
        return ProjectStats(
            project_id=project_id,
            datasets=datasets_count,
            analyses=analyses_count,
            figures=figures_count,
            created_at=project['created_at'],
            last_updated=project['updated_at']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get project stats: {str(e)}"
        )


# =====================================
# Analysis Routes
# =====================================

@router.get("/{project_id}/analyses", response_model=AnalysisListResponse)
async def list_project_analyses(
    project_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_db_client)
):
    """List analyses for a specific project"""
    try:
        # Check if project exists and belongs to user
        project_response = db.table('projects').select('id').eq('id', project_id).eq('user_id', current_user.id).execute()
        
        if not project_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get analyses for this project
        query = db.table('analyses').select('*').eq('project_id', project_id).eq('user_id', current_user.id)
        
        # Get total count
        count_response = query.execute()
        total = len(count_response.data) if count_response.data else 0
        
        # Get paginated results
        response = query.range(offset, offset + limit - 1).order('created_at', desc=True).execute()
        
        analyses = []
        for analysis in response.data:
            analyses.append(AnalysisResponse(
                id=analysis['id'],
                name=analysis.get('name'),
                description=analysis.get('description'),
                project_id=analysis.get('project_id'),
                dataset_id=analysis['dataset_id'],
                user_id=analysis['user_id'],
                analysis_type=analysis['analysis_type'],
                parameters=analysis['parameters'],
                results=analysis['results'],
                figures=analysis.get('figures', {}),
                created_at=analysis['created_at'],
                is_public=analysis['is_public']
            ))
        
        return AnalysisListResponse(
            analyses=analyses,
            total=total,
            page=page,
            limit=limit,
            has_next=offset + limit < total,
            has_prev=page > 1
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project analyses: {str(e)}"
        )


# =====================================
# General Analysis Routes (not project-specific)
# =====================================

@router.get("/analyses", response_model=AnalysisListResponse, include_in_schema=False)
async def list_user_analyses(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_db_client)
):
    """List all user's analyses with optional project filter"""
    try:
        # Calculate offset
        offset = (page - 1) * limit
        
        # Build query
        query = db.table('analyses').select('*').eq('user_id', current_user.id)
        
        # Add project filter if provided
        if project_id:
            query = query.eq('project_id', project_id)
        
        # Get total count
        count_response = query.execute()
        total = len(count_response.data) if count_response.data else 0
        
        # Get paginated results
        response = query.range(offset, offset + limit - 1).order('created_at', desc=True).execute()
        
        analyses = []
        for analysis in response.data:
            analyses.append(AnalysisResponse(
                id=analysis['id'],
                name=analysis.get('name'),
                description=analysis.get('description'),
                project_id=analysis.get('project_id'),
                dataset_id=analysis['dataset_id'],
                user_id=analysis['user_id'],
                analysis_type=analysis['analysis_type'],
                parameters=analysis['parameters'],
                results=analysis['results'],
                figures=analysis.get('figures', {}),
                created_at=analysis['created_at'],
                is_public=analysis['is_public']
            ))
        
        return AnalysisListResponse(
            analyses=analyses,
            total=total,
            page=page,
            limit=limit,
            has_next=offset + limit < total,
            has_prev=page > 1
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analyses: {str(e)}"
        ) 