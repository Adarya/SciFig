#!/bin/bash

# Local Testing Script for SciFig
# Run this before any deployment to catch errors early

set -e

echo "🧪 SciFig Local Testing Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Function to cleanup background processes
cleanup() {
    print_status "Cleaning up background processes..."
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
    sleep 2
}

# Set trap to cleanup on exit
trap cleanup EXIT

print_status "Starting backend server for testing..."

# Start backend server in background
cd backend
python -m uvicorn app.main:app --reload --port 8001 &
BACKEND_PID=$!

# Wait for server to start
print_status "Waiting for server to start..."
sleep 5

# Test backend endpoints
print_status "Testing backend endpoints..."

# Test health endpoint
print_status "Testing /health endpoint..."
if curl -f -s http://localhost:8001/health > /dev/null; then
    print_success "✅ /health endpoint working"
    HEALTH_RESPONSE=$(curl -s http://localhost:8001/health | jq -r '.status' 2>/dev/null || echo "invalid_json")
    if [ "$HEALTH_RESPONSE" = "healthy" ]; then
        print_success "✅ Health check returns 'healthy' status"
    else
        print_warning "⚠️ Health check status: $HEALTH_RESPONSE"
    fi
else
    print_error "❌ /health endpoint failed"
    exit 1
fi

# Test root endpoint
print_status "Testing / endpoint..."
if curl -f -s http://localhost:8001/ > /dev/null; then
    print_success "✅ / (root) endpoint working"
else
    print_error "❌ / (root) endpoint failed"
    exit 1
fi

# Test API info endpoint
print_status "Testing /api endpoint..."
if curl -f -s http://localhost:8001/api > /dev/null; then
    print_success "✅ /api endpoint working"
else
    print_error "❌ /api endpoint failed"
    exit 1
fi

# Test API documentation
print_status "Testing /docs endpoint..."
if curl -f -s http://localhost:8001/docs > /dev/null; then
    print_success "✅ /docs endpoint working"
else
    print_warning "⚠️ /docs endpoint may not be working (this is often normal)"
fi

print_success "🎉 All backend tests passed!"

# Go back to project root
cd ..

# Test frontend build (if Node.js is available)
if command -v node &> /dev/null && command -v yarn &> /dev/null; then
    print_status "Testing frontend build..."
    
    if yarn build; then
        print_success "✅ Frontend builds successfully"
        
        # Check if dist directory was created
        if [ -d "dist" ]; then
            print_success "✅ Build artifacts created in dist/"
            
            # Check for key files
            if [ -f "dist/index.html" ]; then
                print_success "✅ index.html found in build"
            else
                print_warning "⚠️ index.html not found in build"
            fi
        else
            print_error "❌ Build directory (dist/) not created"
            exit 1
        fi
    else
        print_error "❌ Frontend build failed"
        exit 1
    fi
else
    print_warning "⚠️ Node.js/Yarn not found - skipping frontend tests"
fi

print_success "🚀 All tests passed! Safe to deploy."

echo ""
print_status "Summary:"
print_success "✅ Backend server starts without errors"
print_success "✅ Health endpoint returns 200 OK"
print_success "✅ API endpoints accessible"
print_success "✅ Frontend builds successfully (if tested)"

echo ""
print_status "You can now safely commit and deploy your changes!"

exit 0
