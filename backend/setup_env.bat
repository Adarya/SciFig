@echo off

REM SciFig AI Backend Environment Setup Script for Windows
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
echo ✅ Environment created successfully!
echo.
echo 🚀 To get started:
echo    1. Activate the environment:
echo       conda activate scifig-ai
echo.
echo    2. Run tests:
echo       python run_tests.py
echo.
echo    3. Start the development server:
echo       uvicorn app.main:app --reload
echo.
echo 💡 Tip: You can also run tests with environment check:
echo    python run_tests.py --install  # Creates env if needed
echo.
pause 