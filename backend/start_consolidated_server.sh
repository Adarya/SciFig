#!/bin/bash

# SciFig AI Consolidated Server Startup Script
# This script properly starts the unified monolithic server

echo "🚀 Starting SciFig AI Consolidated Server..."
echo "📁 Working directory: $(pwd)"

# Ensure we're in the backend directory
if [[ ! -f "scifig_api_server.py" ]]; then
    echo "❌ Error: scifig_api_server.py not found in current directory"
    echo "💡 Please run this script from the backend/ directory"
    exit 1
fi

# Set Python path
export PYTHONPATH=$(pwd)
echo "✅ Python path set to: $PYTHONPATH"

# Start the server
echo "🌐 Starting server on http://127.0.0.1:8000"
echo "📊 All endpoints will be available:"
echo "   • Health: http://127.0.0.1:8000/health"
echo "   • API Docs: http://127.0.0.1:8000/docs"
echo "   • Enhanced Analysis: http://127.0.0.1:8000/analyze/comprehensive"
echo "   • Test Recommendation: http://127.0.0.1:8000/recommend_test"
echo ""
echo "Press Ctrl+C to stop the server"
echo "============================================"

python -m uvicorn scifig_api_server:app --reload --host 127.0.0.1 --port 8000 