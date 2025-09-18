"""File upload and dataset management routes"""

import os
import uuid
import json
import pandas as pd
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from supabase import Client

from ..config.settings import settings
from ..config.database import get_db_client
from ..auth.dependencies import get_current_active_user, get_user_authenticated_db_client
from ..auth.models import UserResponse
from .models import DatasetResponse, DatasetListResponse, DatasetDataResponse, UploadResponse

router = APIRouter(prefix="/files", tags=["files"])


# =====================================
# File Upload Routes
# =====================================

@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_user_authenticated_db_client)
):
    """Upload a dataset file (CSV, Excel, etc.)"""
    
    # Validate file type
    allowed_types = ['.csv', '.xlsx', '.xls', '.tsv', '.txt']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_ext} not supported. Allowed types: {allowed_types}"
        )
    
    # Check file size
    if file.size and file.size > settings.max_file_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum limit of {settings.max_file_size} bytes"
        )
    
    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}_{file.filename}"
        file_path = os.path.join(settings.upload_dir, safe_filename)
        
        # Save file to disk
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Parse the file to get metadata
        try:
            if file_ext == '.csv':
                df = pd.read_csv(file_path)
            elif file_ext in ['.xlsx', '.xls']:
                df = pd.read_excel(file_path)
            elif file_ext == '.tsv':
                df = pd.read_csv(file_path, sep='\t')
            elif file_ext == '.txt':
                # Try to detect separator
                with open(file_path, 'r') as f:
                    first_line = f.readline()
                    if '\t' in first_line:
                        df = pd.read_csv(file_path, sep='\t')
                    elif ',' in first_line:
                        df = pd.read_csv(file_path)
                    else:
                        df = pd.read_csv(file_path, sep=None, engine='python')
            else:
                raise ValueError(f"Unsupported file type: {file_ext}")
            
            # Convert datetime columns to strings for JSON serialization
            for col in df.columns:
                if df[col].dtype == 'datetime64[ns]':
                    df[col] = df[col].astype(str)
            
            columns = df.columns.tolist()
            rows = len(df)
            
            # Prepare metadata
            metadata = {
                'file_extension': file_ext,
                'original_filename': file.filename,
                'column_types': {col: str(df[col].dtype) for col in df.columns},
                'file_path': file_path,
                'encoding': 'utf-8'
            }
            
        except Exception as e:
            # Clean up file if parsing failed
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse file: {str(e)}"
            )
        
        # Store dataset metadata in database
        # Note: Store file_path in metadata since it's not a direct column
        metadata['file_path'] = file_path
        
        dataset_data = {
            'id': file_id,
            'name': os.path.splitext(file.filename)[0],
            'file_name': file.filename,
            'file_size': len(content),
            'columns_info': columns,
            'row_count': rows,
            'user_id': current_user.id,
            'metadata': metadata
        }
        
        response = db.table('datasets').insert(dataset_data).execute()
        
        if not response.data:
            # Clean up file if database insert failed
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save dataset metadata"
            )
        
        dataset = response.data[0]
        
        dataset_response = DatasetResponse(
            id=dataset['id'],
            name=dataset['name'],
            file_name=dataset['file_name'],
            file_size=dataset['file_size'],
            columns_info=dataset['columns_info'],
            row_count=dataset['row_count'],
            upload_date=dataset['upload_date'],
            user_id=dataset['user_id'],
            metadata=dataset['metadata']
        )
        
        return UploadResponse(
            dataset=dataset_response,
            message="File uploaded and processed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up file if anything else failed
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


# =====================================
# Dataset Management Routes
# =====================================

@router.get("/datasets", response_model=DatasetListResponse)
async def list_datasets(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_user_authenticated_db_client)
):
    """List user's datasets with pagination"""
    try:
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get datasets for this user
        query = db.table('datasets').select('*').eq('user_id', current_user.id)
        
        # Get total count
        count_response = query.execute()
        total = len(count_response.data) if count_response.data else 0
        
        # Get paginated results
        response = query.range(offset, offset + limit - 1).order('upload_date', desc=True).execute()
        
        datasets = []
        for dataset in response.data:
            datasets.append(DatasetResponse(
                id=dataset['id'],
                name=dataset['name'],
                file_name=dataset['file_name'],
                file_size=dataset['file_size'],
                columns_info=dataset['columns_info'],
                row_count=dataset['row_count'],
                upload_date=dataset['upload_date'],
                user_id=dataset['user_id'],
                metadata=dataset.get('metadata', {})
            ))
        
        return DatasetListResponse(
            datasets=datasets,
            total=total,
            page=page,
            limit=limit,
            has_next=offset + limit < total,
            has_prev=page > 1
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch datasets: {str(e)}"
        )


@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_user_authenticated_db_client)
):
    """Get dataset metadata by ID"""
    try:
        response = db.table('datasets').select('*').eq('id', dataset_id).eq('user_id', current_user.id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        
        dataset = response.data[0]
        
        return DatasetResponse(
            id=dataset['id'],
            name=dataset['name'],
            file_name=dataset['file_name'],
            file_size=dataset['file_size'],
            columns_info=dataset['columns_info'],
            row_count=dataset['row_count'],
            upload_date=dataset['upload_date'],
            user_id=dataset['user_id'],
            metadata=dataset.get('metadata', {})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dataset: {str(e)}"
        )


@router.get("/datasets/{dataset_id}/data", response_model=DatasetDataResponse)
async def get_dataset_data(
    dataset_id: str,
    limit: Optional[int] = Query(None, ge=1, le=10000, description="Limit number of rows"),
    offset: Optional[int] = Query(None, ge=0, description="Skip number of rows"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_user_authenticated_db_client)
):
    """Get dataset data (rows and columns)"""
    try:
        # First get dataset metadata
        dataset_response = db.table('datasets').select('*').eq('id', dataset_id).eq('user_id', current_user.id).execute()
        
        if not dataset_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        
        dataset = dataset_response.data[0]
        file_path = dataset['metadata'].get('file_path')
        
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset file not found on disk"
            )
        
        # Read the data file
        file_ext = dataset['metadata'].get('file_extension', '.csv')
        
        try:
            if file_ext == '.csv':
                df = pd.read_csv(file_path)
            elif file_ext in ['.xlsx', '.xls']:
                df = pd.read_excel(file_path)
            elif file_ext == '.tsv':
                df = pd.read_csv(file_path, sep='\t')
            elif file_ext == '.txt':
                df = pd.read_csv(file_path, sep=None, engine='python')
            else:
                raise ValueError(f"Unsupported file type: {file_ext}")
            
            # Convert datetime columns to strings for JSON serialization
            for col in df.columns:
                if df[col].dtype == 'datetime64[ns]':
                    df[col] = df[col].astype(str)
            
            total_rows = len(df)
            
            # Apply pagination if specified
            if offset is not None:
                df = df.iloc[offset:]
            if limit is not None:
                df = df.head(limit)
            
            # Convert to records (list of dicts)
            data = df.to_dict('records')
            
            return DatasetDataResponse(
                data=data,
                columns=df.columns.tolist(),
                total_rows=total_rows,
                limit=limit,
                offset=offset
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read dataset file: {str(e)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dataset data: {str(e)}"
        )


@router.delete("/datasets/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Client = Depends(get_user_authenticated_db_client)
):
    """Delete a dataset and its file"""
    try:
        # Get dataset info first
        dataset_response = db.table('datasets').select('*').eq('id', dataset_id).eq('user_id', current_user.id).execute()
        
        if not dataset_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        
        dataset = dataset_response.data[0]
        file_path = dataset['metadata'].get('file_path')
        
        # Delete from database
        db.table('datasets').delete().eq('id', dataset_id).execute()
        
        # Delete file from disk
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                # Log but don't fail if file deletion fails
                print(f"Warning: Failed to delete file {file_path}: {e}")
        
        return {"message": "Dataset deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete dataset: {str(e)}"
        )
