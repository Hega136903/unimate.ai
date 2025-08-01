#!/bin/bash

# Unimate.AI Deployment Script

echo "🚀 Starting Unimate.AI Deployment Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_info "Step 1: Building Frontend..."
npm run build
if [ $? -eq 0 ]; then
    print_status "Frontend build completed successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

print_info "Step 2: Building Backend..."
cd backend
npm run build
if [ $? -eq 0 ]; then
    print_status "Backend build completed successfully"
else
    print_error "Backend build failed"
    exit 1
fi
cd ..

print_info "Step 3: Running Tests..."
npm run lint
if [ $? -eq 0 ]; then
    print_status "Linting passed"
else
    print_warning "Linting issues found (not blocking deployment)"
fi

print_status "🎉 Build process completed successfully!"
print_info "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your GitHub repo to Vercel (Frontend)"
echo "3. Connect your GitHub repo to Railway (Backend)"
echo "4. Set up MongoDB Atlas database"
echo "5. Configure environment variables"

echo ""
print_info "Useful commands:"
echo "• Test frontend locally: npm run dev"
echo "• Test backend locally: cd backend && npm run dev"
echo "• View deployment guide: cat DEPLOYMENT_GUIDE.md"
