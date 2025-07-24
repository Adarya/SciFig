"""
File Processing Service for SciFig AI
Handles CSV/Excel file parsing, validation, and metadata extraction
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from pathlib import Path
import uuid
from datetime import datetime, timedelta

# Optional import for magic - fallback to mimetypes if not available
try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False
    magic = None

class FileProcessor:
    """Process uploaded data files and extract metadata"""
    
    def __init__(self):
        self.supported_formats = ['.csv', '.xlsx', '.xls']
        self.max_preview_rows = 100
    
    async def process_file(self, 
                          file_path: str, 
                          original_filename: str,
                          user_id: Optional[str] = None,
                          project_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Process uploaded file and extract data + metadata
        """
        
        try:
            # Validate file
            self._validate_file(file_path)
            
            # Read data based on file type
            df = self._read_file(file_path)
            
            # Clean and validate data
            df_cleaned = self._clean_data(df)
            
            # Extract metadata
            metadata = self._extract_metadata(df_cleaned, original_filename)
            
            # Generate column information
            columns_info = self._analyze_columns(df_cleaned)
            
            # Create preview data
            preview_data = self._create_preview(df_cleaned)
            
            # Convert to records for JSON serialization
            data_records = df_cleaned.to_dict('records')
            
            return {
                "data": data_records,
                "metadata": metadata,
                "columns": list(df_cleaned.columns),
                "columns_info": columns_info,
                "preview": preview_data,
                "file_info": {
                    "original_filename": original_filename,
                    "processed_at": datetime.now().isoformat(),
                    "user_id": user_id,
                    "project_id": project_id
                }
            }
            
        except Exception as e:
            raise ValueError(f"File processing failed: {str(e)}")
    
    def _validate_file(self, file_path: str) -> None:
        """Validate file format and content"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if file_path.suffix.lower() not in self.supported_formats:
            raise ValueError(f"Unsupported file format: {file_path.suffix}")
        
        # Check file size (already done in API, but double-check)
        file_size = file_path.stat().st_size
        max_size = 100 * 1024 * 1024  # 100MB
        if file_size > max_size:
            raise ValueError(f"File too large: {file_size / (1024*1024):.1f}MB")
    
    def _read_file(self, file_path: str) -> pd.DataFrame:
        """Read file based on extension"""
        file_path = Path(file_path)
        
        try:
            if file_path.suffix.lower() == '.csv':
                # Try different encodings and separators
                encodings = ['utf-8', 'latin-1', 'cp1252']
                separators = [',', ';', '\t']
                
                for encoding in encodings:
                    for sep in separators:
                        try:
                            df = pd.read_csv(file_path, encoding=encoding, sep=sep)
                            if len(df.columns) > 1:  # Valid separator found
                                return df
                        except:
                            continue
                
                # Fallback to default
                df = pd.read_csv(file_path)
                
            elif file_path.suffix.lower() in ['.xlsx', '.xls']:
                df = pd.read_excel(file_path)
            
            else:
                raise ValueError(f"Unsupported file type: {file_path.suffix}")
            
            if df.empty:
                raise ValueError("File is empty")
            
            return df
            
        except Exception as e:
            raise ValueError(f"Failed to read file: {str(e)}")
    
    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and standardize data"""
        df_clean = df.copy()
        
        # Remove completely empty rows and columns
        df_clean = df_clean.dropna(how='all')
        df_clean = df_clean.dropna(axis=1, how='all')
        
        # Clean column names
        df_clean.columns = df_clean.columns.astype(str)
        df_clean.columns = [col.strip().replace(' ', '_').replace('-', '_').lower() 
                           for col in df_clean.columns]
        
        # Remove duplicate columns
        df_clean = df_clean.loc[:, ~df_clean.columns.duplicated()]
        
        # Limit number of rows for processing
        max_rows = 10000  # Reasonable limit for web processing
        if len(df_clean) > max_rows:
            df_clean = df_clean.head(max_rows)
        
        return df_clean
    
    def _extract_metadata(self, df: pd.DataFrame, filename: str) -> Dict[str, Any]:
        """Extract comprehensive metadata from dataset"""
        
        metadata = {
            "filename": filename,
            "shape": {
                "rows": len(df),
                "columns": len(df.columns)
            },
            "column_count": len(df.columns),
            "row_count": len(df),
            "missing_data": {
                "total_missing": int(df.isnull().sum().sum()),
                "missing_percentage": float(df.isnull().sum().sum() / (len(df) * len(df.columns)) * 100),
                "columns_with_missing": df.columns[df.isnull().any()].tolist()
            },
            "data_types": df.dtypes.astype(str).to_dict(),
            "memory_usage": {
                "total_mb": float(df.memory_usage(deep=True).sum() / 1024 / 1024),
                "per_column": df.memory_usage(deep=True).to_dict()
            },
            "summary_statistics": self._get_summary_stats(df),
            "data_quality": self._assess_data_quality(df)
        }
        
        return metadata
    
    def _analyze_columns(self, df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
        """Analyze each column for type detection and recommendations"""
        columns_info = {}
        
        for col in df.columns:
            series = df[col]
            
            # Basic info
            info = {
                "name": col,
                "type": self._detect_column_type(series),
                "unique_count": int(series.nunique()),
                "missing_count": int(series.isnull().sum()),
                "missing_percentage": float(series.isnull().sum() / len(series) * 100),
                "sample_values": series.dropna().head(5).tolist()
            }
            
            # Type-specific analysis
            if info["type"] == "continuous":
                info.update({
                    "min": float(series.min()) if pd.notnull(series.min()) else None,
                    "max": float(series.max()) if pd.notnull(series.max()) else None,
                    "mean": float(series.mean()) if pd.notnull(series.mean()) else None,
                    "std": float(series.std()) if pd.notnull(series.std()) else None,
                    "quartiles": series.quantile([0.25, 0.5, 0.75]).to_dict() if series.dtype in ['int64', 'float64'] else None
                })
            
            elif info["type"] == "categorical":
                value_counts = series.value_counts().head(10)
                info.update({
                    "categories": value_counts.index.tolist(),
                    "category_counts": value_counts.to_dict(),
                    "most_frequent": str(series.mode().iloc[0]) if not series.mode().empty else None
                })
            
            # Variable role suggestion
            info["suggested_role"] = self._suggest_variable_role(col, series)
            
            columns_info[col] = info
        
        return columns_info
    
    def _detect_column_type(self, series: pd.Series) -> str:
        """Detect if column is continuous, categorical, or other"""
        # Remove missing values for analysis
        clean_series = series.dropna()
        
        if len(clean_series) == 0:
            return "unknown"
        
        # Check if numeric
        if pd.api.types.is_numeric_dtype(clean_series):
            unique_count = clean_series.nunique()
            total_count = len(clean_series)
            
            # If less than 10 unique values or less than 5% unique, consider categorical
            if unique_count < 10 or (unique_count / total_count) < 0.05:
                return "categorical"
            else:
                return "continuous"
        
        # Check if datetime
        elif pd.api.types.is_datetime64_any_dtype(clean_series):
            return "datetime"
        
        # Check if boolean
        elif pd.api.types.is_bool_dtype(clean_series):
            return "categorical"
        
        # String/object type
        else:
            unique_count = clean_series.nunique()
            total_count = len(clean_series)
            
            # If many unique values relative to total, might be an identifier
            if unique_count / total_count > 0.9:
                return "identifier"
            else:
                return "categorical"
    
    def _suggest_variable_role(self, column_name: str, series: pd.Series) -> str:
        """Suggest the role of variable (outcome, group, time, etc.)"""
        col_lower = column_name.lower()
        
        # Outcome keywords
        outcome_keywords = ['outcome', 'score', 'result', 'response', 'efficacy', 'effect', 
                           'measurement', 'value', 'level', 'concentration', 'rate']
        
        # Group keywords  
        group_keywords = ['treatment', 'group', 'condition', 'arm', 'therapy', 'drug', 
                         'intervention', 'category', 'class', 'type']
        
        # Time keywords
        time_keywords = ['time', 'duration', 'days', 'weeks', 'months', 'years', 'date',
                        'follow', 'survival', 'period']
        
        # Event keywords
        event_keywords = ['event', 'death', 'died', 'status', 'censor', 'endpoint', 'failure']
        
        # ID keywords
        id_keywords = ['id', 'patient', 'subject', 'participant', 'case', 'number']
        
        if any(keyword in col_lower for keyword in outcome_keywords):
            return "outcome"
        elif any(keyword in col_lower for keyword in group_keywords):
            return "group"
        elif any(keyword in col_lower for keyword in time_keywords):
            return "time"
        elif any(keyword in col_lower for keyword in event_keywords):
            return "event"
        elif any(keyword in col_lower for keyword in id_keywords):
            return "identifier"
        else:
            return "covariate"
    
    def _get_summary_stats(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get summary statistics for the dataset"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) > 0:
            return {
                "numeric_summary": df[numeric_cols].describe().to_dict(),
                "correlations": df[numeric_cols].corr().to_dict() if len(numeric_cols) > 1 else {}
            }
        else:
            return {"numeric_summary": {}, "correlations": {}}
    
    def _assess_data_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Assess overall data quality"""
        total_cells = len(df) * len(df.columns)
        missing_cells = df.isnull().sum().sum()
        
        # Duplicate rows
        duplicate_rows = df.duplicated().sum()
        
        # Columns with high missing data
        high_missing_cols = df.columns[df.isnull().sum() / len(df) > 0.5].tolist()
        
        # Data quality score (simple heuristic)
        quality_score = 100
        quality_score -= (missing_cells / total_cells) * 50  # Penalize missing data
        quality_score -= (duplicate_rows / len(df)) * 30    # Penalize duplicates
        quality_score -= len(high_missing_cols) * 10        # Penalize high-missing columns
        quality_score = max(0, min(100, quality_score))     # Clamp to 0-100
        
        return {
            "quality_score": round(quality_score, 1),
            "issues": {
                "missing_data_percentage": round((missing_cells / total_cells) * 100, 2),
                "duplicate_rows": int(duplicate_rows),
                "high_missing_columns": high_missing_cols,
                "potential_issues": self._identify_potential_issues(df)
            },
            "recommendations": self._generate_recommendations(df)
        }
    
    def _identify_potential_issues(self, df: pd.DataFrame) -> List[str]:
        """Identify potential data issues"""
        issues = []
        
        # Check for completely empty columns
        empty_cols = df.columns[df.isnull().all()].tolist()
        if empty_cols:
            issues.append(f"Empty columns detected: {empty_cols}")
        
        # Check for single-value columns
        single_value_cols = []
        for col in df.columns:
            if df[col].nunique() == 1:
                single_value_cols.append(col)
        if single_value_cols:
            issues.append(f"Columns with single value: {single_value_cols}")
        
        # Check for potential outliers in numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            outliers = df[(df[col] < q1 - 1.5*iqr) | (df[col] > q3 + 1.5*iqr)][col]
            if len(outliers) > len(df) * 0.1:  # More than 10% outliers
                issues.append(f"Many potential outliers in {col}")
        
        return issues
    
    def _generate_recommendations(self, df: pd.DataFrame) -> List[str]:
        """Generate data improvement recommendations"""
        recommendations = []
        
        # Missing data
        missing_pct = df.isnull().sum().sum() / (len(df) * len(df.columns)) * 100
        if missing_pct > 10:
            recommendations.append("Consider handling missing data before analysis")
        
        # Small sample size
        if len(df) < 30:
            recommendations.append("Small sample size may limit statistical power")
        
        # Too many categorical levels
        cat_cols = df.select_dtypes(include=['object']).columns
        for col in cat_cols:
            if df[col].nunique() > 20:
                recommendations.append(f"Consider grouping categories in {col}")
        
        return recommendations
    
    def _create_preview(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Create a preview of the data for frontend display"""
        preview_rows = min(self.max_preview_rows, len(df))
        
        return {
            "rows": df.head(preview_rows).to_dict('records'),
            "total_rows": len(df),
            "showing_rows": preview_rows,
            "columns": [
                {
                    "name": col,
                    "type": str(df[col].dtype),
                    "sample_values": df[col].dropna().head(3).tolist()
                }
                for col in df.columns
            ]
        } 