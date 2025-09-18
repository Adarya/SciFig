"""File and dataset models"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class DatasetResponse(BaseModel):
    """Model for dataset response"""
    id: str
    name: str
    file_name: str
    file_size: int
    columns_info: List[str]
    row_count: int
    upload_date: datetime
    user_id: str
    metadata: Dict[str, Any] = {}
    
    # Compatibility properties for frontend
    @property
    def filename(self) -> str:
        return self.file_name
    
    @property 
    def columns(self) -> List[str]:
        return self.columns_info
    
    @property
    def rows(self) -> int:
        return self.row_count
        
    @property
    def created_at(self) -> datetime:
        return self.upload_date


class DatasetListResponse(BaseModel):
    """Model for paginated dataset list response"""
    datasets: List[DatasetResponse]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool


class DatasetDataResponse(BaseModel):
    """Model for dataset data response"""
    data: List[Dict[str, Any]]
    columns: List[str]
    total_rows: int
    limit: Optional[int] = None
    offset: Optional[int] = None


class UploadResponse(BaseModel):
    """Model for file upload response"""
    dataset: DatasetResponse
    message: str = "File uploaded successfully"
