"""
Pytest configuration and fixtures for SciFig AI backend tests
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
import pandas as pd
import numpy as np
from pathlib import Path
import tempfile
import os

from app.main import app
from app.services.statistical_engine import EngineOrchestrator
from app.services.figure_generator import FigureGenerator
from app.services.file_processor import FileProcessor

# Event loop fixture for async tests
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def client():
    """FastAPI test client"""
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
async def async_client():
    """Async HTTP client for testing"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def sample_csv_data():
    """Sample CSV data for testing"""
    return pd.DataFrame({
        'group': ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'] * 3,
        'outcome': [0.85, 0.72, 0.91, 0.68, 0.88, 0.74, 0.92, 0.71] * 3,
        'age': [45, 52, 38, 41, 47, 55, 43, 49] * 3
    })

@pytest.fixture
def sample_csv_file(sample_csv_data, tmp_path):
    """Create temporary CSV file for testing"""
    csv_file = tmp_path / "test_data.csv"
    sample_csv_data.to_csv(csv_file, index=False)
    return csv_file

@pytest.fixture
def sample_excel_file(sample_csv_data, tmp_path):
    """Create temporary Excel file for testing"""
    excel_file = tmp_path / "test_data.xlsx"
    sample_csv_data.to_excel(excel_file, index=False)
    return excel_file

@pytest.fixture
def large_dataset():
    """Large dataset for performance testing"""
    np.random.seed(42)
    n = 1000
    return pd.DataFrame({
        'group': np.random.choice(['Treatment', 'Control'], n),
        'outcome': np.random.normal(0.8, 0.15, n),
        'age': np.random.randint(18, 80, n),
        'gender': np.random.choice(['M', 'F'], n),
        'baseline_score': np.random.normal(50, 10, n)
    })

@pytest.fixture
def categorical_dataset():
    """Dataset with categorical outcome for chi-square testing"""
    np.random.seed(42)
    return pd.DataFrame({
        'treatment': ['Drug_A', 'Drug_B', 'Placebo'] * 50,
        'response': np.random.choice(['Success', 'Failure'], 150, p=[0.6, 0.4]),
        'severity': np.random.choice(['Mild', 'Moderate', 'Severe'], 150)
    })

@pytest.fixture
def missing_data_dataset():
    """Dataset with missing data for robustness testing"""
    np.random.seed(42)
    data = pd.DataFrame({
        'group': ['A', 'B'] * 25,
        'outcome': np.random.normal(0.75, 0.2, 50),
        'covariate': np.random.normal(100, 15, 50)
    })
    
    # Introduce missing data
    missing_indices = np.random.choice(50, 10, replace=False)
    data.loc[missing_indices, 'outcome'] = np.nan
    
    missing_indices2 = np.random.choice(50, 5, replace=False)
    data.loc[missing_indices2, 'covariate'] = np.nan
    
    return data

@pytest.fixture
def analysis_request_payload():
    """Standard analysis request payload"""
    return {
        "dataset_id": "test-dataset-123",
        "outcome_variable": "outcome",
        "group_variable": "group",
        "analysis_type": "t_test"
    }

@pytest.fixture
def engine_orchestrator():
    """Statistical engine orchestrator instance"""
    return EngineOrchestrator()

@pytest.fixture
def figure_generator():
    """Figure generator instance"""
    return FigureGenerator(output_dir="tests/temp_figures")

@pytest.fixture
def file_processor():
    """File processor instance"""
    return FileProcessor()

@pytest.fixture
def mock_auth_headers():
    """Mock authentication headers"""
    return {"Authorization": "Bearer mock-jwt-token-12345"}

@pytest.fixture
def temp_upload_dir(tmp_path):
    """Temporary upload directory"""
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir()
    return upload_dir

@pytest.fixture(autouse=True)
def cleanup_temp_files():
    """Cleanup temporary files after each test"""
    yield
    # Cleanup logic can be added here if needed
    temp_dirs = ["tests/temp_figures", "uploads", "static/figures"]
    for temp_dir in temp_dirs:
        if os.path.exists(temp_dir):
            import shutil
            try:
                shutil.rmtree(temp_dir)
            except:
                pass  # Ignore cleanup errors in tests

# Test data validation helpers
def assert_statistical_result_structure(result):
    """Assert that statistical result has proper structure"""
    assert "test_name" in result
    assert "statistic" in result
    assert "p_value" in result
    assert isinstance(result["p_value"], (int, float))
    assert 0 <= result["p_value"] <= 1

def assert_data_profile_structure(profile):
    """Assert that data profile has proper structure"""
    required_fields = [
        "sample_size", "outcome_variable", "outcome_type", 
        "variables", "n_groups"
    ]
    for field in required_fields:
        assert field in profile

def assert_figure_file_exists(file_path):
    """Assert that figure file exists and is valid"""
    assert os.path.exists(file_path)
    assert os.path.getsize(file_path) > 0  # File is not empty
    
    # Check file extension
    valid_extensions = ['.png', '.svg', '.pdf', '.eps']
    assert any(file_path.endswith(ext) for ext in valid_extensions) 