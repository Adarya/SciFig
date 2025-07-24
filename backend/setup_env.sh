#!/bin/bash

# SciFig AI Backend Environment Setup Script
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
echo "✅ Environment created successfully!"
echo ""
echo "🚀 To get started:"
echo "   1. Activate the environment:"
echo "      conda activate scifig-ai"
echo ""
echo "   2. Run tests:"
echo "      python run_tests.py"
echo ""
echo "   3. Start the development server:"
echo "      uvicorn app.main:app --reload"
echo ""
echo "💡 Tip: You can also run tests with environment check:"
echo "   python run_tests.py --install  # Creates env if needed"
echo "" 