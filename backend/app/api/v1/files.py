from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer
import pandas as pd
import os
import uuid
from typing import List, Dict, Any
from pathlib import Path

# Optional import for magic - fallback to mimetypes if not available
try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False
    magic = None

from app.core.config import settings
from app.services.file_processor import FileProcessor
from app.models.database import Dataset, Project
from app.services.auth import get_current_user_optional

router = APIRouter()
security = HTTPBearer(auto_error=False)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    project_id: str = None,
    current_user = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """
    Upload and process a data file (CSV/Excel)
    """
    
    # Validate file size
    if file.size and file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, 
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    # Validate file extension
    if not any(file.filename.lower().endswith(ext) for ext in settings.ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    try:
        # Create upload directory if it doesn't exist
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix.lower()
        stored_filename = f"{file_id}{file_extension}"
        file_path = upload_dir / stored_filename
        
        # Save file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Process file
        processor = FileProcessor()
        file_info = await processor.process_file(
            file_path=str(file_path),
            original_filename=file.filename,
            user_id=current_user.id if current_user else None,
            project_id=project_id
        )
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "size": len(content),
            "processed_data": file_info["data"],
            "metadata": file_info["metadata"],
            "columns": file_info["columns"],
            "preview": file_info["preview"]
        }
        
    except Exception as e:
        # Clean up file if processing failed
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

@router.get("/datasets/{dataset_id}")
async def get_dataset(
    dataset_id: str,
    current_user = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """
    Get dataset information and data
    """
    # TODO: Implement database lookup
    # For now, return mock data
    return {
        "id": dataset_id,
        "filename": "sample_data.csv",
        "columns": ["group", "outcome", "age"],
        "row_count": 100,
        "metadata": {
            "column_types": {
                "group": "categorical",
                "outcome": "continuous", 
                "age": "continuous"
            }
        }
    }

@router.get("/datasets/{dataset_id}/data")
async def get_dataset_data(
    dataset_id: str,
    limit: int = 1000,
    current_user = Depends(get_current_user_optional)
) -> List[Dict[str, Any]]:
    """
    Get actual dataset data with pagination
    """
    # TODO: Implement database lookup and return actual data
    # For now, return mock data
    mock_data = [
        {"group": "A", "outcome": 0.85, "age": 45},
        {"group": "B", "outcome": 0.72, "age": 52},
        {"group": "A", "outcome": 0.91, "age": 38}
    ]
    
    return mock_data[:limit]

@router.delete("/datasets/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    current_user = Depends(get_current_user_optional)
) -> Dict[str, str]:
    """
    Delete a dataset and its associated file
    """
    # TODO: Implement proper deletion with security checks
    return {"message": f"Dataset {dataset_id} deleted successfully"} 