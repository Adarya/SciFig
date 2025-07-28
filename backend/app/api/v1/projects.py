from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.services.database_service import ProjectService
from app.services.auth import get_current_user_required, AuthenticatedUser
from app.core.database import get_db
from app.models.database import Project

router = APIRouter()

# Request/Response Models
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    study_type: Optional[str] = None
    is_shared: Optional[bool] = False

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    study_type: Optional[str] = None
    is_shared: Optional[bool] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    study_type: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_shared: bool
    user_id: str
    datasets_count: Optional[int] = 0
    analyses_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int
    page: int
    limit: int

# API Endpoints

@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """
    Get all projects for the current user with pagination and search
    """
    try:
        projects = ProjectService.get_user_projects(
            db=db, 
            user_id=str(current_user.id), 
            limit=limit,
            offset=(page - 1) * limit,
            search=search
        )
        
        # Get project statistics
        project_responses = []
        for project in projects:
            stats = ProjectService.get_project_stats(db, str(project.id))
            project_responses.append(ProjectResponse(
                id=str(project.id),
                name=project.name,
                description=project.description,
                study_type=project.study_type,
                created_at=project.created_at,
                updated_at=project.updated_at,
                is_shared=project.is_shared,
                user_id=str(project.user_id),
                datasets_count=stats.get('datasets', 0),
                analyses_count=stats.get('analyses', 0)
            ))
        
        total = ProjectService.count_user_projects(db, str(current_user.id), search)
        
        return ProjectListResponse(
            projects=project_responses,
            total=total,
            page=page,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {str(e)}")

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: AuthenticatedUser = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """
    Create a new project
    """
    try:
        project = ProjectService.create_project(
            db=db,
            user_id=str(current_user.id),
            name=project_data.name,
            description=project_data.description,
            study_type=project_data.study_type,
            is_shared=project_data.is_shared
        )
        
        return ProjectResponse(
            id=str(project.id),
            name=project.name,
            description=project.description,
            study_type=project.study_type,
            created_at=project.created_at,
            updated_at=project.updated_at,
            is_shared=project.is_shared,
            user_id=str(project.user_id),
            datasets_count=0,
            analyses_count=0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """
    Get a specific project by ID
    """
    try:
        project = ProjectService.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if user has access to this project
        if str(project.user_id) != str(current_user.id) and not project.is_shared:
            raise HTTPException(status_code=403, detail="Access denied to this project")
        
        stats = ProjectService.get_project_stats(db, project_id)
        
        return ProjectResponse(
            id=str(project.id),
            name=project.name,
            description=project.description,
            study_type=project.study_type,
            created_at=project.created_at,
            updated_at=project.updated_at,
            is_shared=project.is_shared,
            user_id=str(project.user_id),
            datasets_count=stats.get('datasets', 0),
            analyses_count=stats.get('analyses', 0)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch project: {str(e)}")

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_updates: ProjectUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """
    Update a project
    """
    try:
        project = ProjectService.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if user owns this project
        if str(project.user_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="You can only update your own projects")
        
        # Prepare updates
        updates = {}
        for field, value in project_updates.dict(exclude_unset=True).items():
            updates[field] = value
        
        updated_project = ProjectService.update_project(db, project_id, **updates)
        
        stats = ProjectService.get_project_stats(db, project_id)
        
        return ProjectResponse(
            id=str(updated_project.id),
            name=updated_project.name,
            description=updated_project.description,
            study_type=updated_project.study_type,
            created_at=updated_project.created_at,
            updated_at=updated_project.updated_at,
            is_shared=updated_project.is_shared,
            user_id=str(updated_project.user_id),
            datasets_count=stats.get('datasets', 0),
            analyses_count=stats.get('analyses', 0)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """
    Delete a project and all associated data
    """
    try:
        project = ProjectService.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if user owns this project
        if str(project.user_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="You can only delete your own projects")
        
        success = ProjectService.delete_project(db, project_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete project")
        
        return {"message": "Project deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")

@router.get("/{project_id}/stats")
async def get_project_stats(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """
    Get detailed statistics for a project
    """
    try:
        project = ProjectService.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if user has access to this project
        if str(project.user_id) != str(current_user.id) and not project.is_shared:
            raise HTTPException(status_code=403, detail="Access denied to this project")
        
        stats = ProjectService.get_project_stats(db, project_id)
        
        return {
            "project_id": project_id,
            "datasets": stats.get('datasets', 0),
            "analyses": stats.get('analyses', 0),
            "figures": stats.get('figures', 0),
            "created_at": project.created_at,
            "last_updated": project.updated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch project stats: {str(e)}") 