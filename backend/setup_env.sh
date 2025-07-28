#!/bin/bash

# SciFig AI Backend Environment Setup Script
# Updated January 2025 - includes all dependencies for latest functionality
set -e

echo "🔬 Setting up SciFig AI Backend Environment"
echo "=========================================="

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "❌ Conda is not installed or not in PATH"
    echo "   Please install Anaconda or Miniconda first:"
    echo "   https://docs.conda.io/en/latest/miniconda.html"
    exit 1
fi

# Create/update conda environment
echo "📦 Creating conda environment 'scifig-ai'..."

# Check if environment exists
if conda env list | grep -q "scifig-ai"; then
    echo "   Environment exists, removing first..."
    conda env remove -n scifig-ai -y
fi

conda env create -f environment.yml

echo ""
echo "📋 Installing additional required dependencies..."

# Install additional dependencies that aren't available in conda
/opt/anaconda3/envs/scifig-ai/bin/pip install PyJWT python-jose[cryptography] supabase lifelines

echo ""
echo "🧪 Verifying all dependencies..."
/opt/anaconda3/envs/scifig-ai/bin/python -c "
try:
    import jwt, supabase, lifelines
    from publication_viz_engine import PublicationVizEngine
    print('✅ All dependencies verified successfully!')
except ImportError as e:
    print(f'❌ Missing dependency: {e}')
    exit(1)
"

echo ""
echo "✅ Environment setup completed successfully!"
echo ""
echo "🚀 To start the SciFig AI backend:"
echo "   1. Make sure you're in the backend directory:"
echo "      cd backend"
echo ""
echo "   2. Set the Python path and start the server:"
echo "      export PYTHONPATH=\$(pwd)"
echo "      /opt/anaconda3/envs/scifig-ai/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
echo ""
echo "   3. Or use the simplified conda activation method:"
echo "      conda activate scifig-ai"
echo "      cd backend && export PYTHONPATH=\$(pwd)"
echo "      python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
echo ""
echo "🌐 Once running, the backend will be available at:"
echo "   • API: http://localhost:8000"
echo "   • Health Check: http://localhost:8000/health"
echo "   • API Docs: http://localhost:8000/docs"
echo ""
echo "💡 Note: Database warnings ('degraded' status) are normal in development"
echo "   The core functionality works regardless of database status."
echo "" 