#!/bin/bash
# Bash script to start SciFig backend server
# Usage: ./start_server.sh

echo "🚀 Starting SciFig Backend Server..."

# Set environment variables for bash/zsh
export DEBUG="true"
export SECRET_KEY="your-super-secret-jwt-key-here-make-it-long-and-random-must-be-at-least-32-characters"
export SUPABASE_URL="https://your-supabase-url.supabase.co"
export SUPABASE_KEY="your-supabase-anon-key-here"
export APP_NAME="SciFig AI Statistical Engine"
export APP_VERSION="2.0.0"
export CORS_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:5174"

echo "📋 Environment configured:"
echo "  DEBUG: $DEBUG"
echo "  SECRET_KEY: [HIDDEN]"
echo "  SUPABASE_URL: $SUPABASE_URL"

echo ""
echo "🔍 Running diagnostics first..."
python diagnose_figure_error.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Diagnostics passed! Starting server..."
    echo "🌐 Server will be available at: http://localhost:8000"
    echo "📖 API Documentation: http://localhost:8000/docs"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
else
    echo ""
    echo "❌ Diagnostics failed! Please check the errors above."
    echo "💡 Make sure you have installed all dependencies:"
    echo "   pip install -r requirements.txt"
    exit 1
fi

echo ""
echo "Server stopped."
