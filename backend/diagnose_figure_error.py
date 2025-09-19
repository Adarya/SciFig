#!/usr/bin/env python3
"""
Diagnostic script to identify figure generation issues
"""

import os
import sys
import traceback
import json

def test_dependencies():
    """Test if all required dependencies are available"""
    print("🔍 Testing dependencies...")
    
    required_packages = [
        'pandas', 'numpy', 'matplotlib', 'seaborn', 'scipy', 
        'lifelines', 'fastapi', 'pydantic', 'supabase'
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError as e:
            print(f"❌ {package}: {e}")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️ Missing packages: {missing}")
        return False
    else:
        print("\n✅ All dependencies available")
        return True

def test_environment():
    """Test environment configuration"""
    print("\n🔍 Testing environment configuration...")
    
    # Set minimal required env vars
    os.environ['DEBUG'] = 'true'
    os.environ['SECRET_KEY'] = 'test-secret-key-with-at-least-32-chars-for-jwt-validation'
    
    try:
        from app.config.settings import create_settings
        settings = create_settings()
        print(f"✅ Settings loaded: {settings.app_name}")
        return True
    except Exception as e:
        print(f"❌ Settings failed: {str(e)}")
        traceback.print_exc()
        return False

def test_visualization_service():
    """Test the visualization service directly"""
    print("\n🔍 Testing visualization service...")
    
    try:
        from app.visualization.services import PublicationVizService
        import pandas as pd
        import numpy as np
        
        # Create test data
        data = pd.DataFrame({
            'group': ['Low'] * 5 + ['High'] * 5,
            'outcome': [10, 11, 9, 12, 10, 13, 14, 12, 15, 13],
            'time': [50, 45, 60, 55, 48, 30, 35, 25, 40, 32],
            'event': [1, 0, 1, 0, 1, 1, 0, 1, 1, 0]
        })
        
        viz_service = PublicationVizService(style='nature')
        print("✅ Visualization service initialized")
        
        # Test box plot
        try:
            figure_b64 = viz_service.create_publication_boxplot(
                data=data,
                outcome_var='outcome',
                group_var='group',
                title='Test Box Plot',
                format_type='png'
            )
            print(f"✅ Box plot generated ({len(figure_b64)} chars)")
        except Exception as e:
            print(f"❌ Box plot failed: {str(e)}")
            traceback.print_exc()
            return False
        
        # Test survival analysis
        try:
            figure_b64 = viz_service.create_kaplan_meier_plot(
                data=data,
                time_var='time',
                event_var='event',
                group_var='group',
                title='Test Survival Plot',
                format_type='png'
            )
            print(f"✅ Survival plot generated ({len(figure_b64)} chars)")
        except Exception as e:
            print(f"❌ Survival plot failed: {str(e)}")
            traceback.print_exc()
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Visualization service failed: {str(e)}")
        traceback.print_exc()
        return False

def test_endpoint_logic():
    """Test the actual endpoint logic"""
    print("\n🔍 Testing endpoint logic...")
    
    try:
        from app.visualization.routes import PublicationFigureRequest
        
        # Create a test request
        test_data = [
            {'group': 'Low', 'outcome': 10.5, 'time': 50, 'event': 1},
            {'group': 'High', 'outcome': 12.2, 'time': 30, 'event': 0},
            {'group': 'Low', 'outcome': 9.8, 'time': 45, 'event': 1},
            {'group': 'High', 'outcome': 13.1, 'time': 25, 'event': 1}
        ]
        
        request = PublicationFigureRequest(
            data=test_data,
            analysis_type="survival_analysis",
            outcome_variable="outcome",
            group_variable="group",
            time_variable="time",
            event_variable="event",
            format="png"
        )
        
        print("✅ Request model created successfully")
        
        # Test the actual endpoint logic (without the async part)
        import pandas as pd
        from app.visualization.services import PublicationVizService
        
        df = pd.DataFrame(request.data)
        df = df.dropna(subset=[request.time_variable, request.event_variable, request.group_variable])
        
        settings = request.publication_settings or {}
        style = settings.get('journal_style', 'nature')
        viz_service = PublicationVizService(style=style)
        
        figure_b64 = viz_service.create_kaplan_meier_plot(
            data=df,
            time_var=request.time_variable,
            event_var=request.event_variable,
            group_var=request.group_variable,
            title=request.custom_labels.get('title') if request.custom_labels else None,
            custom_labels=request.custom_labels,
            format_type=request.format
        )
        
        print(f"✅ Endpoint logic test passed ({len(figure_b64)} chars)")
        return True
        
    except Exception as e:
        print(f"❌ Endpoint logic failed: {str(e)}")
        traceback.print_exc()
        return False

def main():
    """Run all diagnostic tests"""
    print("🔬 SciFig Figure Generation Diagnostics\n")
    
    tests = [
        ("Dependencies", test_dependencies),
        ("Environment", test_environment),
        ("Visualization Service", test_visualization_service),
        ("Endpoint Logic", test_endpoint_logic)
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ {test_name} test crashed: {str(e)}")
            traceback.print_exc()
            results[test_name] = False
    
    print(f"\n📊 Test Results:")
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {test_name}: {status}")
    
    if all(results.values()):
        print(f"\n🎉 All tests passed! The issue might be environment-specific.")
        print(f"💡 Try restarting your server with proper environment variables.")
    else:
        print(f"\n⚠️ Some tests failed. Check the errors above.")
        
    return all(results.values())

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
