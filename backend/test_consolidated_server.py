#!/usr/bin/env python3
"""
SciFig AI: Consolidated Server Testing Script
Tests all core functionality of the unified monolithic server
"""

import requests
import json
import sys
import time
from typing import Dict, Any

# Server configuration
BASE_URL = "http://localhost:8000"

def test_endpoint(name: str, method: str, endpoint: str, data: Dict[str, Any] = None) -> bool:
    """Test a single endpoint and return success status"""
    try:
        url = f"{BASE_URL}{endpoint}"
        
        if method.upper() == "GET":
            response = requests.get(url, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=10)
        else:
            print(f"❌ {name}: Unsupported method {method}")
            return False
        
        if response.status_code == 200:
            print(f"✅ {name}: SUCCESS ({response.status_code})")
            return True
        else:
            print(f"❌ {name}: FAILED ({response.status_code})")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   Error: {response.text[:100]}...")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: CONNECTION FAILED - Is the server running?")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ {name}: TIMEOUT")
        return False
    except Exception as e:
        print(f"❌ {name}: ERROR - {e}")
        return False

def run_comprehensive_tests() -> bool:
    """Run all comprehensive tests"""
    print("🚀 Testing SciFig AI Consolidated Server")
    print("=" * 50)
    
    tests_passed = 0
    total_tests = 0
    
    # Test 1: Root endpoint
    total_tests += 1
    if test_endpoint("Root Endpoint", "GET", "/"):
        tests_passed += 1
    
    # Test 2: Health check
    total_tests += 1
    if test_endpoint("Health Check", "GET", "/health"):
        tests_passed += 1
    
    # Test 3: API Status  
    total_tests += 1
    if test_endpoint("API Status", "GET", "/api/v1/status"):
        tests_passed += 1
    
    # Test 4: Enhanced Statistical Analysis
    test_data = [
        {"group": "A", "value": 10.5},
        {"group": "A", "value": 12.3},
        {"group": "A", "value": 11.8},
        {"group": "B", "value": 15.2},
        {"group": "B", "value": 16.8},
        {"group": "B", "value": 14.9}
    ]
    
    analysis_request = {
        "data": test_data,
        "outcome_variable": "value", 
        "group_variable": "group",
        "analysis_type": "independent_ttest",
        "check_assumptions": True
    }
    
    total_tests += 1
    if test_endpoint("Comprehensive Analysis", "POST", "/analyze/comprehensive", analysis_request):
        tests_passed += 1
    
    # Test 5: Test Recommendation
    data_profile = {
        "outcome_type": "continuous",
        "n_groups": 2,
        "sample_size": 100,
        "columns": ["group", "value"]
    }
    
    total_tests += 1
    if test_endpoint("Test Recommendation", "POST", "/recommend_test", data_profile):
        tests_passed += 1
    
    # Test 6: Assumption Checking
    assumption_request = {
        "data": test_data,
        "outcome_variable": "value",
        "group_variable": "group", 
        "analysis_type": "independent_ttest"
    }
    
    total_tests += 1
    if test_endpoint("Assumption Checking", "POST", "/check_assumptions", assumption_request):
        tests_passed += 1
    
    # Test 7: Legacy Analysis Endpoint (for backwards compatibility)
    legacy_request = {
        "data": test_data,
        "outcome_variable": "value",
        "group_variable": "group",
        "analysis_type": "independent_ttest"
    }
    
    total_tests += 1
    if test_endpoint("Legacy Analysis", "POST", "/analyze", legacy_request):
        tests_passed += 1
    
    # Summary
    print("=" * 50)
    print(f"📊 Test Results: {tests_passed}/{total_tests} passed")
    
    if tests_passed == total_tests:
        print("🎉 ALL TESTS PASSED! Consolidated server is working perfectly.")
        return True
    else:
        print("⚠️  Some tests failed. Check server logs and configuration.")
        return False

def check_server_availability() -> bool:
    """Check if the server is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    """Main testing function"""
    print("🔍 Checking if SciFig AI server is running...")
    
    if not check_server_availability():
        print("❌ Server is not running or not accessible!")
        print("💡 Start the server with:")
        print("   cd backend")
        print("   uvicorn scifig_api_server:app --reload --host 127.0.0.1 --port 8000")
        sys.exit(1)
    
    print("✅ Server is running!")
    print()
    
    # Run tests
    success = run_comprehensive_tests()
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main() 