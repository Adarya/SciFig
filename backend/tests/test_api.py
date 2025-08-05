import pytest
import json
import io
from pathlib import Path
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from httpx import AsyncClient

from scifig_api_server import app


class TestHealthEndpoints:
    """Test basic health and info endpoints"""
    
    def test_root_endpoint(self, client):
        """Test the root endpoint returns correct info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "SciFig AI - Consolidated API Server"
        assert data["version"] == "2.0.0"
        assert data["features"]["enhanced_statistics"] == True
        assert "enhanced_analysis" in data["endpoints"]
    
    def test_health_check_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]  # degraded is acceptable in test env
        assert data["version"] == "2.0.0"
        assert "services" in data
        assert data["services"]["statistical_engine"] == "operational"
        assert data["services"]["enhanced_analysis"] == "operational"


class TestEnhancedStatisticalAPI:
    """Test enhanced statistical analysis endpoints"""
    
    def test_comprehensive_analysis_endpoint(self, client):
        """Test comprehensive analysis with t-test"""
        test_data = [
            {"group": "A", "value": 10.5},
            {"group": "A", "value": 12.3},
            {"group": "A", "value": 11.8},
            {"group": "B", "value": 15.2},
            {"group": "B", "value": 16.8},
            {"group": "B", "value": 14.9}
        ]
        
        request_data = {
            "data": test_data,
            "outcome_variable": "value",
            "group_variable": "group",
            "analysis_type": "independent_ttest",
            "check_assumptions": True
        }
        
        response = client.post("/analyze/comprehensive", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "test_name" in data
        assert "statistic" in data
        assert "p_value" in data
        assert "assumptions_checked" in data
        assert "data_profile" in data
        assert data["recommended_test"] == "independent_ttest"
        assert isinstance(data["assumptions_met"], bool)
    
    def test_test_recommendation_endpoint(self, client):
        """Test test recommendation endpoint"""
        data_profile = {
            "outcome_type": "continuous",
            "n_groups": 2,
            "sample_size": 100,
            "columns": ["group", "value"]
        }
        
        response = client.post("/recommend_test", json=data_profile)
        assert response.status_code == 200
        
        data = response.json()
        assert "recommended_test" in data
        assert "reasoning" in data
        assert data["recommended_test"] in ["independent_ttest", "mann_whitney_u"]
    
    def test_check_assumptions_endpoint(self, client):
        """Test assumption checking endpoint"""
        test_data = [
            {"group": "A", "value": 10.5},
            {"group": "A", "value": 12.3},
            {"group": "B", "value": 15.2},
            {"group": "B", "value": 16.8}
        ]
        
        request_data = {
            "data": test_data,
            "outcome_variable": "value",
            "group_variable": "group",
            "analysis_type": "independent_ttest"
        }
        
        response = client.post("/check_assumptions", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "assumptions" in data
        assert "all_met" in data
        assert isinstance(data["all_met"], bool)
        assert isinstance(data["assumptions"], list)


class TestFileUploadAPI:
    """Test file upload and dataset management endpoints"""
    
    def test_upload_csv_file_success(self, client, sample_csv_file):
        """Test successful CSV file upload"""
        with open(sample_csv_file, 'rb') as f:
            response = client.post(
                "/api/v1/upload",
                files={"file": ("test.csv", f, "text/csv")}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert "file_id" in data  # Updated to match actual API response
        assert data["filename"] == "test.csv"
        assert "columns" in data
        assert len(data["columns"]) > 0
    
    def test_upload_excel_file_success(self, client, sample_excel_file):
        """Test successful Excel file upload"""
        with open(sample_excel_file, 'rb') as f:
            response = client.post(
                "/api/v1/upload",
                files={"file": ("test.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert "file_id" in data  # Updated to match actual API response
        assert data["filename"] == "test.xlsx"
    
    def test_upload_unsupported_file_type(self, client):
        """Test upload with unsupported file type"""
        # Create a fake text file
        file_content = b"This is not a CSV or Excel file"
        response = client.post(
            "/api/v1/upload",
            files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "not supported" in data["detail"].lower()
    
    def test_upload_no_file(self, client):
        """Test upload without providing a file"""
        response = client.post("/api/v1/upload")
        assert response.status_code == 422  # Validation error
    
    def test_upload_empty_file(self, client):
        """Test upload with empty file"""
        response = client.post(
            "/api/v1/upload",
            files={"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "empty" in data["detail"].lower()
    
    def test_get_dataset_info(self, client):
        """Test getting dataset information"""
        # This is mocked data for now
        response = client.get("/api/v1/datasets/test-id")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "filename" in data
        assert "columns" in data
    
    def test_get_dataset_data(self, client):
        """Test getting dataset data"""
        # This is mocked data for now
        response = client.get("/api/v1/datasets/test-id/data")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total_rows" in data
    
    def test_delete_dataset(self, client):
        """Test deleting a dataset"""
        # This is mocked data for now
        response = client.delete("/api/v1/datasets/test-id")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestAnalysisAPI:
    """Test statistical analysis endpoints"""
    
    def test_run_analysis_success(self, client, analysis_request_payload):
        """Test successful analysis execution"""
        response = client.post(
            "/api/v1/run",
            json=analysis_request_payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "analysis_id" in data
        assert "test_type" in data
        assert "results" in data
        assert "assumptions_met" in data
        
        # Check statistical results structure
        results = data["results"]
        assert "statistic" in results
        assert "p_value" in results
        assert "interpretation" in results
    
    def test_run_analysis_invalid_data(self, client):
        """Test analysis with invalid data structure"""
        invalid_payload = {
            "data": [],  # Empty data
            "variables": ["group", "value"],
            "test_type": "t_test",
            "alpha": 0.05
        }
        
        response = client.post("/api/v1/run", json=invalid_payload)
        assert response.status_code == 400
        data = response.json()
        assert "insufficient data" in data["detail"].lower()
    
    def test_run_analysis_missing_variables(self, client):
        """Test analysis with missing required variables"""
        invalid_payload = {
            "data": [{"group": "A", "value": 1}, {"group": "B", "value": 2}],
            "variables": ["nonexistent_column"],
            "test_type": "t_test",
            "alpha": 0.05
        }
        
        response = client.post("/api/v1/run", json=invalid_payload)
        assert response.status_code == 400
    
    def test_run_analysis_automatic_test_selection(self, client):
        """Test analysis with automatic test selection"""
        payload = {
            "data": [
                {"group": "A", "value": 10}, {"group": "A", "value": 12},
                {"group": "B", "value": 15}, {"group": "B", "value": 17}
            ],
            "variables": ["group", "value"],
            "test_type": "auto",  # Let the system choose
            "alpha": 0.05
        }
        
        response = client.post("/api/v1/run", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["test_type"] in ["t_test", "mann_whitney", "chi_square"]
    
    def test_get_analysis_results(self, client):
        """Test retrieving analysis results"""
        # This uses mocked data for now
        response = client.get("/api/v1/test-analysis-id")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "test_type" in data
        assert "results" in data
    
    def test_get_analysis_figures(self, client):
        """Test retrieving analysis figures"""
        # This uses mocked data for now
        response = client.get("/api/v1/test-analysis-id/figures")
        assert response.status_code == 200
        data = response.json()
        assert "figures" in data
        assert len(data["figures"]) > 0
    
    def test_regenerate_figures(self, client):
        """Test regenerating figures with new parameters"""
        payload = {
            "style": "science",
            "dpi": 600,
            "format": "png"
        }
        
        response = client.post(
            "/api/v1/test-analysis-id/figures/regenerate",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "regenerating" in data["message"].lower()
    
    def test_list_analyses(self, client):
        """Test listing user analyses"""
        response = client.get("/api/v1/")
        assert response.status_code == 200
        data = response.json()
        assert "analyses" in data
        assert isinstance(data["analyses"], list)


class TestAuthAPI:
    """Test authentication endpoints"""
    
    def test_login_success(self, client):
        """Test successful login"""
        payload = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        response = client.post("/api/v1/login", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        payload = {
            "email": "invalid@example.com",
            "password": "wrongpassword"
        }
        
        response = client.post("/api/v1/login", json=payload)
        assert response.status_code == 401
        data = response.json()
        assert "invalid credentials" in data["detail"].lower()
    
    def test_login_missing_fields(self, client):
        """Test login with missing required fields"""
        payload = {"email": "test@example.com"}  # Missing password
        
        response = client.post("/api/v1/login", json=payload)
        assert response.status_code == 422  # Validation error
    
    def test_logout(self, client, mock_auth_headers):
        """Test logout endpoint"""
        response = client.post("/api/v1/logout", headers=mock_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Successfully logged out"
    
    def test_get_current_user_info(self, client, mock_auth_headers):
        """Test getting current user information"""
        response = client.get("/api/v1/me", headers=mock_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "subscription_tier" in data
    
    def test_get_current_user_info_unauthorized(self, client):
        """Test getting user info without authentication"""
        response = client.get("/api/v1/me")
        assert response.status_code == 401
    
    def test_check_auth_status_authenticated(self, client, mock_auth_headers):
        """Test auth status check with valid token"""
        response = client.get("/api/v1/check", headers=mock_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert "user" in data
    
    def test_check_auth_status_unauthenticated(self, client):
        """Test auth status check without token"""
        response = client.get("/api/v1/check")
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is False


class TestAPIIntegration:
    """Integration tests that combine multiple API endpoints"""
    
    def test_complete_analysis_workflow(self, client, sample_csv_file):
        """Test complete workflow: upload file -> run analysis -> get results"""
        # Step 1: Upload file
        with open(sample_csv_file, 'rb') as f:
            upload_response = client.post(
                "/api/v1/upload",
                files={"file": ("test.csv", f, "text/csv")}
            )
        
        assert upload_response.status_code == 200
        upload_data = upload_response.json()
        dataset_id = upload_data["dataset_id"]
        
        # Step 2: Run analysis using uploaded data
        analysis_payload = {
            "dataset_id": dataset_id,
            "data": [
                {"group": "A", "value": 10}, {"group": "A", "value": 12},
                {"group": "B", "value": 15}, {"group": "B", "value": 17}
            ],
            "variables": ["group", "value"],
            "test_type": "t_test",
            "alpha": 0.05
        }
        
        analysis_response = client.post("/api/v1/run", json=analysis_payload)
        assert analysis_response.status_code == 200
        analysis_data = analysis_response.json()
        analysis_id = analysis_data["analysis_id"]
        
        # Step 3: Get analysis results
        results_response = client.get(f"/api/v1/{analysis_id}")
        assert results_response.status_code == 200
        
        # Step 4: Get figures
        figures_response = client.get(f"/api/v1/{analysis_id}/figures")
        assert figures_response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_async_analysis_workflow(self, async_client, sample_csv_file):
        """Test async workflow for better performance testing"""
        # Upload file
        with open(sample_csv_file, 'rb') as f:
            files = {"file": ("test.csv", f, "text/csv")}
            upload_response = await async_client.post("/api/v1/upload", files=files)
        
        assert upload_response.status_code == 200
        
        # Run analysis
        analysis_payload = {
            "data": [
                {"group": "A", "value": 10}, {"group": "A", "value": 12},
                {"group": "B", "value": 15}, {"group": "B", "value": 17}
            ],
            "variables": ["group", "value"],
            "test_type": "auto",
            "alpha": 0.05
        }
        
        analysis_response = await async_client.post("/api/v1/run", json=analysis_payload)
        assert analysis_response.status_code == 200


class TestAPIErrorHandling:
    """Test API error handling and edge cases"""
    
    def test_invalid_json_payload(self, client):
        """Test handling of invalid JSON in request body"""
        response = client.post(
            "/api/v1/run",
            data="invalid json content",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    def test_missing_content_type(self, client):
        """Test handling requests with missing content type"""
        response = client.post("/api/v1/run", data='{"test": "data"}')
        # FastAPI should handle this gracefully
        assert response.status_code in [422, 400]
    
    def test_large_file_upload(self, client):
        """Test handling of large file uploads"""
        # Create a large CSV content (simulate a file that's too big)
        large_content = "col1,col2\n" + "\n".join([f"{i},{i*2}" for i in range(10000)])
        large_file = io.BytesIO(large_content.encode())
        
        response = client.post(
            "/api/v1/upload",
            files={"file": ("large.csv", large_file, "text/csv")}
        )
        
        # Should either succeed or fail gracefully with proper error message
        assert response.status_code in [200, 413, 400]
    
    def test_concurrent_requests(self, client):
        """Test handling multiple concurrent requests"""
        import threading
        import time
        
        results = []
        
        def make_request():
            response = client.get("/health")
            results.append(response.status_code)
        
        # Create multiple threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        assert all(status == 200 for status in results)
        assert len(results) == 5


class TestAPIPerformance:
    """Basic performance tests for API endpoints"""
    
    def test_analysis_response_time(self, client, analysis_request_payload):
        """Test that analysis completes within reasonable time"""
        import time
        
        start_time = time.time()
        response = client.post("/api/v1/run", json=analysis_request_payload)
        end_time = time.time()
        
        assert response.status_code == 200
        # Analysis should complete within 5 seconds for small datasets
        assert (end_time - start_time) < 5.0
    
    def test_file_upload_response_time(self, client, sample_csv_file):
        """Test file upload performance"""
        import time
        
        start_time = time.time()
        with open(sample_csv_file, 'rb') as f:
            response = client.post(
                "/api/v1/upload",
                files={"file": ("test.csv", f, "text/csv")}
            )
        end_time = time.time()
        
        assert response.status_code == 200
        # File upload and processing should complete within 3 seconds
        assert (end_time - start_time) < 3.0 