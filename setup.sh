#!/bin/bash

# KutiraAI Quick Setup Script
# This script automates the installation process

echo "╔════════════════════════════════════════╗"
echo "║       KutiraAI Installation Setup      ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check Node.js installation
echo "Checking prerequisites..."
echo ""

if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"

    # Check Node.js version
    REQUIRED_VERSION="18.0.0"
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        print_success "Node.js version meets requirements"
    else
        print_warning "Node.js version should be 18.0.0 or higher"
    fi
else
    print_error "Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm installation
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm is not installed"
    exit 1
fi

echo ""
echo "Installing dependencies..."
echo ""

# Install dependencies
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""
echo "Setting up environment..."
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << EOF
# KutiraAI Environment Configuration
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=KutiraAI
VITE_APP_VERSION=1.0.0
EOF
    print_success "Environment file created"
else
    print_warning "Environment file already exists, skipping..."
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║     Installation Complete!             ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Available commands:"
echo "  npm run dev        - Start development server"
echo "  npm run build      - Build for production"
echo "  npm run preview    - Preview production build"
echo "  npm run api-server - Start API server only"
echo ""
echo "To start KutiraAI, run:"
echo -e "${GREEN}npm run dev${NC}"
echo ""
echo "The application will be available at:"
echo "  Frontend: http://localhost:5173"
echo "  API:      http://localhost:3001"
echo ""