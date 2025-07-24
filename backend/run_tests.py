#!/usr/bin/env python3
"""
Test runner for SciFig AI Backend
Provides an easy way to run tests with different configurations
"""

import subprocess
import sys
import argparse
from pathlib import Path


def run_command(command, description=""):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    if description:
        print(f"🧪 {description}")
    print(f"{'='*60}")
    print(f"Running: {command}")
    print("-" * 60)
    
    try:
        result = subprocess.run(command, shell=True, check=True, text=True)
        print(f"✅ {description or 'Command'} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description or 'Command'} failed with exit code {e.returncode}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Run SciFig AI Backend Tests")
    parser.add_argument("--quick", "-q", action="store_true", 
                       help="Run only fast tests (exclude slow/integration tests)")
    parser.add_argument("--coverage", "-c", action="store_true",
                       help="Run tests with coverage report")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="Run tests in verbose mode")
    parser.add_argument("--file", "-f", type=str,
                       help="Run tests from specific file (e.g., test_api.py)")
    parser.add_argument("--test", "-t", type=str,
                       help="Run specific test function")
    parser.add_argument("--install", "-i", action="store_true",
                       help="Install test dependencies first")
    
    args = parser.parse_args()
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    import os
    os.chdir(backend_dir)
    
    success = True
    
    # Setup conda environment if requested
    if args.install:
        # Check if environment exists and remove it
        env_exists = subprocess.run("conda env list | grep -q 'scifig-ai'", 
                                   shell=True, capture_output=True)
        if env_exists.returncode == 0:
            success &= run_command(
                "conda env remove -n scifig-ai -y",
                "Removing existing conda environment"
            )
        
        success &= run_command(
            "conda env create -f environment.yml",
            "Creating conda environment"
        )
        if not success:
            print("\n💡 Tip: Make sure conda is installed and available in PATH")
            print("   You can also install manually with: conda env create -f environment.yml")
            return 1
    
    # Check if we're in the conda environment
    conda_env = os.environ.get('CONDA_DEFAULT_ENV')
    if conda_env != 'scifig-ai':
        print(f"\n⚠️  Warning: Not in 'scifig-ai' conda environment (current: {conda_env or 'none'})")
        print("   To activate: conda activate scifig-ai")
        print("   Or run with --install to create the environment")
        if not args.install:
            print("   Continuing anyway...\n")
    
    # Build pytest command
    pytest_cmd = ["pytest"]
    
    # Add coverage if requested
    if args.coverage:
        pytest_cmd.extend([
            "--cov=app",
            "--cov-report=html",
            "--cov-report=term-missing",
            "--cov-report=xml"
        ])
    
    # Add verbosity
    if args.verbose:
        pytest_cmd.append("-v")
    else:
        pytest_cmd.append("-q")
    
    # Add specific file or test
    if args.file:
        pytest_cmd.append(f"tests/{args.file}")
    elif args.test:
        pytest_cmd.append(f"-k {args.test}")
    else:
        pytest_cmd.append("tests/")
    
    # Add markers for quick tests
    if args.quick:
        pytest_cmd.extend(["-m", "not slow"])
    
    # Add other useful pytest options
    pytest_cmd.extend([
        "--tb=short",  # Shorter tracebacks
        "--strict-markers",  # Ensure all markers are defined
        "--disable-warnings"  # Reduce noise from deprecation warnings
    ])
    
    # Run the tests
    cmd = " ".join(pytest_cmd)
    success &= run_command(cmd, "Running tests")
    
    # Summary
    print(f"\n{'='*60}")
    if success:
        print("🎉 All tests completed successfully!")
        if args.coverage:
            print("📊 Coverage report generated in htmlcov/index.html")
    else:
        print("💥 Some tests failed. Check output above for details.")
    print(f"{'='*60}\n")
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main()) 