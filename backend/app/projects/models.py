"""Project and analysis models"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class ProjectCreate(BaseModel):
    """Model for creating a new project"""
    name: str = Field(..., min_length=1, max_length=200, description="Project name")
    description: Optional[str] = Field(None, max_length=1000, description="Project description")
    study_type: Optional[str] = Field(None, max_length=100, description="Type of study")
    is_shared: bool = Field(default=False, description="Whether project is shared")


class ProjectUpdate(BaseModel):
    """Model for updating a project"""
    name: Optional[str] = Field(None, min_length=1, max_length=200, description="Project name")
    description: Optional[str] = Field(None, max_length=1000, description="Project description")
    study_type: Optional[str] = Field(None, max_length=100, description="Type of study")
    is_shared: Optional[bool] = Field(None, description="Whether project is shared")


class ProjectResponse(BaseModel):
    """Model for project response"""
    id: str
    name: str
    description: Optional[str] = None
    study_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_shared: bool
    user_id: str
    datasets_count: Optional[int] = 0
    analyses_count: Optional[int] = 0


class ProjectListResponse(BaseModel):
    """Model for paginated project list response"""
    projects: List[ProjectResponse]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool


class ProjectStats(BaseModel):
    """Model for project statistics"""
    project_id: str
    datasets: int
    analyses: int
    figures: int
    created_at: datetime
    last_updated: datetime


class AnalysisType(str, Enum):
    """Available analysis types"""
    INDEPENDENT_TTEST = "independent_ttest"
    PAIRED_TTEST = "paired_ttest"
    MANN_WHITNEY = "mann_whitney_u"
    WILCOXON = "wilcoxon_signed_rank"
    ONE_WAY_ANOVA = "one_way_anova"
    REPEATED_MEASURES_ANOVA = "repeated_measures_anova"
    CHI_SQUARE = "chi_square"
    FISHER_EXACT = "fisher_exact"
    SURVIVAL_ANALYSIS = "survival_analysis"
    KAPLAN_MEIER = "kaplan_meier"  # Specific survival analysis method
    LINEAR_REGRESSION = "linear_regression"
    LOGISTIC_REGRESSION = "logistic_regression"
    COX_REGRESSION = "cox_regression"
    STATISTICAL_TEST = "statistical_test"  # Generic statistical test


class AnalysisCreate(BaseModel):
    """Model for creating a new analysis"""
    name: str = Field(..., min_length=1, max_length=200, description="Analysis name")
    description: Optional[str] = Field(None, max_length=1000, description="Analysis description")
    project_id: Optional[str] = Field(None, description="Associated project ID")
    dataset_id: str = Field(..., description="Dataset ID for analysis")
    analysis_type: AnalysisType = Field(..., description="Type of statistical analysis")
    parameters: Dict[str, Any] = Field(..., description="Analysis parameters")
    is_public: bool = Field(default=False, description="Whether analysis is public")


class AnalysisUpdate(BaseModel):
    """Model for updating an analysis"""
    name: Optional[str] = Field(None, min_length=1, max_length=200, description="Analysis name")
    description: Optional[str] = Field(None, max_length=1000, description="Analysis description")
    is_public: Optional[bool] = Field(None, description="Whether analysis is public")
    results: Optional[Dict[str, Any]] = Field(None, description="Analysis results")
    figures: Optional[Dict[str, Any]] = Field(None, description="Generated figures")


class AnalysisResponse(BaseModel):
    """Model for analysis response"""
    id: str
    name: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[str] = None
    dataset_id: Optional[str] = None  # Made optional to handle client-side data
    user_id: str
    analysis_type: str
    parameters: Dict[str, Any]
    results: Dict[str, Any]
    figures: Dict[str, Any]
    created_at: datetime
    is_public: bool


class AnalysisListResponse(BaseModel):
    """Model for paginated analysis list response"""
    analyses: List[AnalysisResponse]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool 