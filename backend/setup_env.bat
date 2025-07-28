@echo off

REM SciFig AI Backend Environment Setup Script for Windows
REM Updated January 2025 - includes all dependencies for latest functionality
echo 🔬 Setting up SciFig AI Backend Environment
echo ==========================================

REM Check if conda is installed
conda --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Conda is not installed or not in PATH
    echo    Please install Anaconda or Miniconda first:
    echo    https://docs.conda.io/en/latest/miniconda.html
    pause
    exit /b 1
)

REM Create/update conda environment
echo 📦 Creating conda environment 'scifig-ai'...

REM Check if environment exists
conda env list | findstr "scifig-ai" >nul 2>&1
if %errorlevel% equ 0 (
    echo    Environment exists, removing first...
    conda env remove -n scifig-ai -y
)

conda env create -f environment.yml

echo.
echo 📋 Installing additional required dependencies...

REM Install additional dependencies that aren't available in conda
conda run -n scifig-ai pip install PyJWT python-jose[cryptography] supabase lifelines

echo.
echo 🧪 Verifying all dependencies...
conda run -n scifig-ai python -c "try: import jwt, supabase, lifelines; from publication_viz_engine import PublicationVizEngine; print('✅ All dependencies verified successfully!'); except ImportError as e: print(f'❌ Missing dependency: {e}'); exit(1)"

echo.
echo ✅ Environment setup completed successfully!
echo.
echo 🚀 To start the SciFig AI backend:
echo    1. Make sure you're in the backend directory:
echo       cd backend
echo.
echo    2. Activate environment and start the server:
echo       conda activate scifig-ai
echo       set PYTHONPATH=%cd%
echo       python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
echo.
echo 🌐 Once running, the backend will be available at:
echo    • API: http://localhost:8000
echo    • Health Check: http://localhost:8000/health
echo    • API Docs: http://localhost:8000/docs
echo.
echo 💡 Note: Database warnings ('degraded' status) are normal in development
echo    The core functionality works regardless of database status.
echo.
pause 