"""
Tests for file processing service
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path

from app.services.file_processor import FileProcessor


class TestFileProcessor:
    """Tests for file processing functionality"""
    
    @pytest.mark.asyncio
    async def test_process_csv_file(self, sample_csv_file, file_processor):
        """Test processing of CSV file"""
        result = await file_processor.process_file(
            file_path=str(sample_csv_file),
            original_filename="test_data.csv"
        )
        
        # Check structure
        assert "data" in result
        assert "metadata" in result
        assert "columns" in result
        assert "columns_info" in result
        assert "preview" in result
        assert "file_info" in result
        
        # Check data content
        assert len(result["data"]) > 0
        assert isinstance(result["data"], list)
        assert isinstance(result["data"][0], dict)
        
        # Check columns
        expected_columns = ["group", "outcome", "age"]
        for col in expected_columns:
            assert col in result["columns"]
    
    @pytest.mark.asyncio
    async def test_process_excel_file(self, sample_excel_file, file_processor):
        """Test processing of Excel file"""
        result = await file_processor.process_file(
            file_path=str(sample_excel_file),
            original_filename="test_data.xlsx"
        )
        
        assert "data" in result
        assert len(result["data"]) > 0
        assert "group" in result["columns"]
        assert "outcome" in result["columns"]
    
    def test_file_validation_unsupported_format(self, file_processor, tmp_path):
        """Test file validation with unsupported format"""
        # Create a text file
        txt_file = tmp_path / "test.txt"
        txt_file.write_text("This is not a CSV or Excel file")
        
        with pytest.raises(ValueError, match="Unsupported file format"):
            file_processor._validate_file(str(txt_file))
    
    def test_file_validation_nonexistent_file(self, file_processor):
        """Test file validation with non-existent file"""
        with pytest.raises(FileNotFoundError):
            file_processor._validate_file("nonexistent_file.csv")
    
    def test_column_type_detection(self, file_processor):
        """Test automatic column type detection"""
        # Continuous data
        continuous_series = pd.Series([1.5, 2.3, 3.7, 4.1, 5.8, 6.2, 7.1, 8.3] * 5)
        assert file_processor._detect_column_type(continuous_series) == "continuous"
        
        # Categorical data
        categorical_series = pd.Series(["Category_A", "Category_B", "Category_C"] * 10)
        assert file_processor._detect_column_type(categorical_series) == "categorical"
        
        # Binary data (should be categorical)
        binary_series = pd.Series([0, 1, 0, 1, 0, 1] * 10)
        assert file_processor._detect_column_type(binary_series) == "categorical"
        
        # Identifier-like data
        id_series = pd.Series([f"ID_{i}" for i in range(100)])
        assert file_processor._detect_column_type(id_series) == "identifier"
    
    def test_variable_role_suggestion(self, file_processor):
        """Test variable role suggestion based on column names"""
        # Outcome variables
        assert file_processor._suggest_variable_role("outcome_score", None) == "outcome"
        assert file_processor._suggest_variable_role("efficacy_measure", None) == "outcome"
        assert file_processor._suggest_variable_role("response_rate", None) == "outcome"
        
        # Group variables
        assert file_processor._suggest_variable_role("treatment_group", None) == "group"
        assert file_processor._suggest_variable_role("intervention_type", None) == "group"
        assert file_processor._suggest_variable_role("drug_category", None) == "group"
        
        # Time variables
        assert file_processor._suggest_variable_role("follow_up_time", None) == "time"
        assert file_processor._suggest_variable_role("survival_days", None) == "time"
        assert file_processor._suggest_variable_role("duration_months", None) == "time"
        
        # Event variables
        assert file_processor._suggest_variable_role("death_status", None) == "event"
        assert file_processor._suggest_variable_role("event_occurred", None) == "event"
        
        # ID variables
        assert file_processor._suggest_variable_role("patient_id", None) == "identifier"
        assert file_processor._suggest_variable_role("subject_number", None) == "identifier"
        
        # Covariate (default)
        assert file_processor._suggest_variable_role("some_random_column", None) == "covariate"
    
    def test_data_cleaning(self, file_processor):
        """Test data cleaning functionality"""
        # Create messy data
        messy_data = pd.DataFrame({
            'Column With Spaces': [1, 2, 3, np.nan],
            'column-with-dashes': [4, 5, 6, 7],
            'UPPERCASE_COLUMN': [8, 9, 10, 11],
            'empty_column': [np.nan, np.nan, np.nan, np.nan],
            'duplicate_col_1': [1, 2, 3, 4],
            'duplicate_col_2': [5, 6, 7, 8]
        })
        
        cleaned_data = file_processor._clean_data(messy_data)
        
        # Check column name cleaning
        expected_columns = ['column_with_spaces', 'column_with_dashes', 'uppercase_column']
        for col in expected_columns:
            assert col in cleaned_data.columns or any(col.replace('_', '') in c.replace('_', '') for c in cleaned_data.columns)
        
        # Empty columns should be removed
        assert len([col for col in cleaned_data.columns if cleaned_data[col].isnull().all()]) == 0
    
    def test_metadata_extraction(self, sample_csv_data, file_processor):
        """Test metadata extraction"""
        metadata = file_processor._extract_metadata(sample_csv_data, "test_file.csv")
        
        # Check required metadata fields
        assert "filename" in metadata
        assert "shape" in metadata
        assert "column_count" in metadata
        assert "row_count" in metadata
        assert "missing_data" in metadata
        assert "data_types" in metadata
        assert "summary_statistics" in metadata
        assert "data_quality" in metadata
        
        # Check values
        assert metadata["filename"] == "test_file.csv"
        assert metadata["row_count"] == len(sample_csv_data)
        assert metadata["column_count"] == len(sample_csv_data.columns)
    
    def test_data_quality_assessment(self, file_processor):
        """Test data quality assessment"""
        # Create data with known quality issues
        problematic_data = pd.DataFrame({
            'good_column': [1, 2, 3, 4, 5] * 20,
            'missing_column': [1, np.nan, 3, np.nan, 5] * 20,
            'single_value_column': [42] * 100,
            'outlier_column': [10] * 95 + [1000, 2000, 3000, 4000, 5000]  # Outliers
        })
        
        quality_assessment = file_processor._assess_data_quality(problematic_data)
        
        assert "quality_score" in quality_assessment
        assert "issues" in quality_assessment
        assert "recommendations" in quality_assessment
        
        # Quality score should be a number between 0 and 100
        assert 0 <= quality_assessment["quality_score"] <= 100
        
        # Should detect missing data
        assert quality_assessment["issues"]["missing_data_percentage"] > 0
    
    @pytest.mark.asyncio
    async def test_missing_data_handling(self, missing_data_dataset, file_processor, tmp_path):
        """Test handling of files with missing data"""
        # Save dataset to file
        csv_file = tmp_path / "missing_data.csv"
        missing_data_dataset.to_csv(csv_file, index=False)
        
        result = await file_processor.process_file(
            file_path=str(csv_file),
            original_filename="missing_data.csv"
        )
        
        # Should process successfully despite missing data
        assert "data" in result
        assert len(result["data"]) > 0
        
        # Metadata should reflect missing data
        assert result["metadata"]["missing_data"]["total_missing"] > 0
        assert result["metadata"]["missing_data"]["missing_percentage"] > 0


class TestFileProcessorEdgeCases:
    """Tests for edge cases and error conditions"""
    
    @pytest.mark.asyncio
    async def test_empty_file(self, file_processor, tmp_path):
        """Test handling of empty files"""
        empty_csv = tmp_path / "empty.csv"
        empty_csv.write_text("")
        
        with pytest.raises(ValueError, match="Failed to read file"):
            await file_processor.process_file(
                file_path=str(empty_csv),
                original_filename="empty.csv"
            )
    
    @pytest.mark.asyncio
    async def test_end_to_end_processing_workflow(self, sample_csv_file, file_processor):
        """Test complete file processing workflow"""
        result = await file_processor.process_file(
            file_path=str(sample_csv_file),
            original_filename="test_data.csv",
            user_id="test_user_123",
            project_id="test_project_456"
        )
        
        # Verify all components work together
        assert "data" in result
        assert "metadata" in result
        assert "columns" in result
        assert "columns_info" in result
        assert "preview" in result
        assert "file_info" in result
        
        # Check file info includes user context
        assert result["file_info"]["user_id"] == "test_user_123"
        assert result["file_info"]["project_id"] == "test_project_456"
        
        # Verify data consistency between sections
        assert len(result["columns"]) == len(result["columns_info"])
        assert result["metadata"]["column_count"] == len(result["columns"])
        assert result["preview"]["total_rows"] == result["metadata"]["row_count"] 