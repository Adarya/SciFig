"""Standalone analysis routes"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import Client
from typing import List, Optional
import json
from datetime import datetime
import time
import logging

from ..config.database import get_db_client
from ..auth.dependencies import get_current_active_user, get_user_authenticated_db_client
from ..auth.models import UserResponse
from ..projects.models import (
    AnalysisCreate, AnalysisUpdate, AnalysisResponse, AnalysisListResponse
)

router = APIRouter(prefix="/analyses", tags=["analyses"])

logger = logging.getLogger(__name__)


@router.get("/", response_model=AnalysisListResponse)
async def list_user_analyses(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    analysis_type: Optional[str] = Query(None, description="Filter by analysis type"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_user_authenticated_db_client)
):
    """List all user's analyses with optional filters"""
    try:
        # Calculate offset
        offset = (page - 1) * limit
        
        # Build query - skip project_id filter for now due to missing column
        query = db.table('analyses').select('*').eq('user_id', current_user.id)
        
        # Add analysis_type filter if provided
        if analysis_type:
            query = query.eq('analysis_type', analysis_type)
        
        # Get all results first (we'll filter by project_id in memory)
        response = query.order('created_at', desc=True).execute()
        
        # Filter by project_id in memory since column might not exist
        filtered_data = response.data or []
        if project_id and filtered_data:
            # Filter by project_id either from column or parameters
            filtered_data = [
                analysis for analysis in filtered_data 
                if (analysis.get('project_id') == project_id or 
                    (analysis.get('parameters', {}).get('project_info', {}).get('project_id') == project_id))
            ]
        
        # Apply pagination after filtering
        total = len(filtered_data)
        start_idx = offset
        end_idx = offset + limit
        paginated_data = filtered_data[start_idx:end_idx]
        
        analyses = []
        for analysis in paginated_data:
            analyses.append(AnalysisResponse(
                id=analysis['id'],
                name=analysis.get('name'),
                description=analysis.get('description'),
                project_id=analysis.get('project_id') or analysis.get('parameters', {}).get('project_info', {}).get('project_id'),
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


@router.post("/", response_model=AnalysisResponse)
async def create_analysis(
    analysis_data: AnalysisCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_user_authenticated_db_client)
):
    """Create a new analysis"""
    try:
        # Handle dataset validation and creation for client-side datasets
        is_client_data = analysis_data.parameters.get('is_client_data', False)
        
        if is_client_data:
            # For client-side datasets, we need to create a temporary dataset record
            # to satisfy the foreign key constraint
            try:
                # Create a temporary dataset record
                temp_dataset = {
                    'id': analysis_data.dataset_id,
                    'user_id': current_user.id,
                    'name': f"Client Data - {int(time.time())}",
                    'description': 'Temporary dataset for client-side analysis data',
                    'file_name': f"client_data_{int(time.time())}.csv",
                    'file_size': 0,
                    'columns_info': {},
                    'row_count': 0,
                    'is_public': False,
                    'metadata': {'client_side': True, 'temporary': True}
                }
                
                logger.info(f"Creating temporary dataset with data: {temp_dataset}")
                dataset_response = db.table('datasets').insert(temp_dataset).execute()
                logger.info(f"Dataset creation response: {dataset_response}")
                
                if not dataset_response.data:
                    raise Exception("Failed to create temporary dataset - no data returned")
                    
                dataset_id = dataset_response.data[0]['id']
                logger.info(f"Successfully created temporary dataset with ID: {dataset_id}")
                
            except Exception as e:
                logger.error(f"Failed to create temporary dataset: {e}")
                logger.error(f"Error type: {type(e)}")
                logger.error(f"Error details: {str(e)}")
                # For now, raise the error instead of falling back to None
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create temporary dataset for client data: {str(e)}"
                )
        else:
            # Verify real dataset belongs to user
            dataset_response = db.table('datasets').select('id').eq('id', analysis_data.dataset_id).eq('user_id', current_user.id).execute()
            
            if not dataset_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Dataset not found or not accessible"
                )
            dataset_id = analysis_data.dataset_id
        
        # Verify project belongs to user if project_id is provided
        if analysis_data.project_id:
            project_response = db.table('projects').select('id').eq('id', analysis_data.project_id).eq('user_id', current_user.id).execute()
            
            if not project_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Project not found or not accessible"
                )
        
        analysis_dict = {
            'name': analysis_data.name,
            'description': analysis_data.description,
            'user_id': current_user.id,
            'analysis_type': analysis_data.analysis_type.value,
            'parameters': analysis_data.parameters,
            'results': {},  # Will be filled when analysis is run
            'figures': {},
            'is_public': analysis_data.is_public
        }
        
        # Add dataset_id only if we have one
        if dataset_id:
            analysis_dict['dataset_id'] = dataset_id
        
        # Note: Not adding project_id field due to missing database column
        # Project info is stored in parameters.project_info instead
        
        response = db.table('analyses').insert(analysis_dict).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create analysis"
            )
        
        analysis = response.data[0]
        
        return AnalysisResponse(
            id=analysis['id'],
            name=analysis.get('name'),
            description=analysis.get('description'),
            project_id=None,  # Not available due to missing column, stored in parameters instead
            dataset_id=analysis.get('dataset_id'),  # Use .get() since it might not exist
            user_id=analysis['user_id'],
            analysis_type=analysis['analysis_type'],
            parameters=analysis['parameters'],
            results=analysis['results'],
            figures=analysis.get('figures', {}),
            created_at=analysis['created_at'],
            is_public=analysis['is_public']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create analysis: {str(e)}"
        )


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_user_authenticated_db_client)
):
    """Get a specific analysis by ID"""
    try:
        response = db.table('analyses').select('*').eq('id', analysis_id).eq('user_id', current_user.id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )
        
        analysis = response.data[0]
        
        return AnalysisResponse(
            id=analysis['id'],
            name=analysis.get('name'),
            description=analysis.get('description'),
            project_id=analysis.get('project_id'),
            dataset_id=analysis.get('dataset_id'),  # Use .get() since it might not exist
            user_id=analysis['user_id'],
            analysis_type=analysis['analysis_type'],
            parameters=analysis['parameters'],
            results=analysis['results'],
            figures=analysis.get('figures', {}),
            created_at=analysis['created_at'],
            is_public=analysis['is_public']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analysis: {str(e)}"
        )


@router.put("/{analysis_id}", response_model=AnalysisResponse)
async def update_analysis(
    analysis_id: str,
    analysis_update: AnalysisUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_user_authenticated_db_client)
):
    """Update an analysis"""
    try:
        # Check if analysis exists and belongs to user
        check_response = db.table('analyses').select('id').eq('id', analysis_id).eq('user_id', current_user.id).execute()
        
        if not check_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )
        
        # Build update data
        update_data = {}
        if analysis_update.name is not None:
            update_data['name'] = analysis_update.name
        if analysis_update.description is not None:
            update_data['description'] = analysis_update.description
        if analysis_update.is_public is not None:
            update_data['is_public'] = analysis_update.is_public
        if analysis_update.results is not None:
            update_data['results'] = analysis_update.results
        if analysis_update.figures is not None:
            update_data['figures'] = analysis_update.figures
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        response = db.table('analyses').update(update_data).eq('id', analysis_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update analysis"
            )
        
        analysis = response.data[0]
        
        return AnalysisResponse(
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
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update analysis: {str(e)}"
        )


@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_user_authenticated_db_client)
):
    """Delete an analysis"""
    try:
        # Check if analysis exists and belongs to user
        check_response = db.table('analyses').select('id').eq('id', analysis_id).eq('user_id', current_user.id).execute()
        
        if not check_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )
        
        # Delete the analysis
        response = db.table('analyses').delete().eq('id', analysis_id).execute()
        
        return {"message": "Analysis deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete analysis: {str(e)}"
        ) 