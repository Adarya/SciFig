#!/bin/bash

# SciFig Deployment Helper Script
# This script helps automate the deployment process

set -e

echo "🚀 SciFig Deployment Helper"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is required but not installed"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed"
        exit 1
    fi
    
    if ! command -v yarn &> /dev/null; then
        print_error "Yarn is required but not installed"
        exit 1
    fi
    
    print_success "All requirements met"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    yarn install
    yarn build
    
    if [ ! -d "dist" ]; then
        print_error "Build failed - dist directory not created"
        exit 1
    fi
    
    print_success "Frontend built successfully"
}

# Prepare environment file
prepare_env() {
    print_status "Checking environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found"
        
        if [ -f "backend/env.example" ]; then
            cp backend/env.example .env
            print_status "Copied env.example to .env"
            print_warning "Please edit .env file with your actual Supabase credentials before deploying"
        else
            print_error "No env.example file found"
            exit 1
        fi
    else
        print_success "Environment file exists"
    fi
    
    # Check for placeholder values
    if grep -q "your-project-id.supabase.co" .env 2>/dev/null; then
        print_error "Please update .env file with your actual Supabase URL"
        exit 1
    fi
    
    if grep -q "your-anon-key-here" .env 2>/dev/null; then
        print_error "Please update .env file with your actual Supabase keys"
        exit 1
    fi
}

# Test local deployment
test_local() {
    print_status "Testing local deployment..."
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not found - skipping local test"
        return
    fi
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found"
        return
    fi
    
    print_status "Building Docker containers..."
    docker-compose build
    
    print_status "Testing containers..."
    docker-compose up -d
    
    # Wait for services to start
    sleep 10
    
    # Test backend health
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        docker-compose logs
        docker-compose down
        exit 1
    fi
    
    docker-compose down
    print_success "Local deployment test passed"
}

# Deploy to platform
deploy_platform() {
    local platform=$1
    
    case $platform in
        "railway")
            print_status "Deploying to Railway..."
            print_status "Please follow the Railway deployment guide in DEPLOYMENT.md"
            ;;
        "vercel")
            print_status "Deploying to Vercel..."
            if command -v vercel &> /dev/null; then
                vercel --prod
            else
                print_warning "Vercel CLI not installed. Please deploy via vercel.com dashboard"
            fi
            ;;
        "render")
            print_status "Deploying to Render..."
            print_status "Please follow the Render deployment guide in DEPLOYMENT.md"
            ;;
        *)
            print_error "Unknown platform: $platform"
            echo "Available platforms: railway, vercel, render"
            exit 1
            ;;
    esac
}

# Generate secure secret key
generate_secret() {
    print_status "Generating secure secret key..."
    
    if command -v python3 &> /dev/null; then
        SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
        echo "Generated secret key: $SECRET_KEY"
        print_status "Add this to your environment variables: SECRET_KEY=$SECRET_KEY"
    elif command -v openssl &> /dev/null; then
        SECRET_KEY=$(openssl rand -hex 32)
        echo "Generated secret key: $SECRET_KEY"
        print_status "Add this to your environment variables: SECRET_KEY=$SECRET_KEY"
    else
        print_error "Neither python3 nor openssl found. Please generate a secret key manually."
        print_status "You can use any 32+ character random string"
    fi
}

# Main menu
main_menu() {
    echo ""
    echo "What would you like to do?"
    echo "1. Check requirements"
    echo "2. Build frontend"
    echo "3. Prepare environment"
    echo "4. Test local deployment"
    echo "5. Generate secret key"
    echo "6. Deploy to platform"
    echo "7. Full deployment check (1-4)"
    echo "8. Exit"
    echo ""
    
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1)
            check_requirements
            ;;
        2)
            build_frontend
            ;;
        3)
            prepare_env
            ;;
        4)
            test_local
            ;;
        5)
            generate_secret
            ;;
        6)
            echo "Available platforms: railway, vercel, render"
            read -p "Enter platform name: " platform
            deploy_platform $platform
            ;;
        7)
            check_requirements
            build_frontend
            prepare_env
            test_local
            print_success "Full deployment check completed!"
            print_status "You're ready to deploy to your chosen platform"
            ;;
        8)
            print_status "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            main_menu
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    main_menu
}

# Run main menu if script is called without arguments
if [ $# -eq 0 ]; then
    main_menu
else
    # Handle command line arguments
    case $1 in
        "check")
            check_requirements
            ;;
        "build")
            build_frontend
            ;;
        "env")
            prepare_env
            ;;
        "test")
            test_local
            ;;
        "secret")
            generate_secret
            ;;
        "full")
            check_requirements
            build_frontend
            prepare_env
            test_local
            ;;
        *)
            echo "Usage: $0 [check|build|env|test|secret|full]"
            echo "Or run without arguments for interactive menu"
            exit 1
            ;;
    esac
fi
