#!/bin/bash

# =============================================================================
# AI Platform Setup Script
# =============================================================================

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${GREEN}[✓] $1${NC}"; }
print_warning() { echo -e "${YELLOW}[!] $1${NC}"; }
print_error() { echo -e "${RED}[✗] $1${NC}"; }
print_info() { echo -e "${BLUE}[i] $1${NC}"; }

echo -e "${BLUE}"
echo "============================================================================="
echo "                        AI Platform Startup"
echo "============================================================================="
echo -e "${NC}"

# Stop any existing fine-tuning services first
if [ -f stop_fine_tune.sh ]; then
    print_info "Stopping any existing fine-tuning services..."
    ./stop_fine_tune.sh > /dev/null 2>&1 || true
    print_status "Previous services stopped"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_info "Please edit .env file with your configuration before continuing."
        print_info "Required: Set your HUGGINGFACE_API_TOKEN and database passwords."
        echo ""
        read -p "Press Enter after you've configured .env file..."
    else
        print_error ".env.example file not found!"
        exit 1
    fi
fi

# Load environment variables
source .env
print_status "Environment variables loaded"

# Check prerequisites
print_info "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker Desktop."
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Desktop."
    exit 1
fi

print_status "Docker and Docker Compose are available"

# Function to initialize databases
initialize_databases() {
    print_info "Checking database initialization status..."

    # Check if product database is already initialized
    PRODUCT_INITIALIZED=$(docker exec postgres-product psql -U ${PRODUCT_POSTGRES_USER} -d ${PRODUCT_POSTGRES_DB} -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='dataset_master_table');" 2>/dev/null || echo "false")

    # Check if workflow database is already initialized
    WORKFLOW_INITIALIZED=$(docker exec postgres-workflow psql -U ${WORKFLOW_POSTGRES_USER} -d ${WORKFLOW_POSTGRES_DB} -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='workflows');" 2>/dev/null || echo "false")

    # Initialize product database if needed
    if [ "$PRODUCT_INITIALIZED" = "f" ] || [ "$PRODUCT_INITIALIZED" = "false" ]; then
        print_info "Initializing product database..."
        # Capture output to check for actual errors vs notices
        DB_OUTPUT=$(docker exec -i postgres-product psql -U ${PRODUCT_POSTGRES_USER} -d ${PRODUCT_POSTGRES_DB} < product_api/db/init/product/01-init.sql 2>&1)
        DB_EXIT_CODE=$?

        # Check if there are actual ERROR messages (not just NOTICE)
        if echo "$DB_OUTPUT" | grep -q "^ERROR:" && ! echo "$DB_OUTPUT" | grep -q "already exists"; then
            print_warning "Product database initialization had some errors, but may have succeeded"
        else
            print_status "Product database initialized successfully"
        fi
    else
        print_status "Product database already initialized"
    fi

    # Initialize workflow database if needed
    if [ "$WORKFLOW_INITIALIZED" = "f" ] || [ "$WORKFLOW_INITIALIZED" = "false" ]; then
        print_info "Initializing workflow database..."
        # Run the SQL and capture output, ignore errors for existing tables
        docker exec -i postgres-workflow psql -U ${WORKFLOW_POSTGRES_USER} -d ${WORKFLOW_POSTGRES_DB} < product_api/db/init/workflow/02-init.sql > /dev/null 2>&1
        print_status "Workflow database initialization completed"
    else
        print_status "Workflow database already initialized"
    fi
}

# Check if running on Apple Silicon for fine-tuning service
if [[ $(uname -m) == "arm64" ]]; then
    print_status "Apple Silicon detected - fine-tuning service will work"
else
    print_warning "Non-Apple Silicon detected - fine-tuning service requires Apple Silicon (M1/M2/M3)"
    print_info "Fine-tuning service will be skipped"
fi

# Check Python for fine-tuning service
if [[ $(uname -m) == "arm64" ]]; then
    if ! command -v python3 &> /dev/null; then
        print_warning "Python3 not found. Fine-tuning service requires Python 3.11+"
        print_info "Install Python: brew install python@3.11"
    else
        print_status "Python3 is available for fine-tuning service"
    fi
fi

# Start the platform
print_info "Starting AI Platform Docker services..."

# Stop any running containers and clear caches for fresh start
print_info "Preparing fresh start (clearing caches)..."
docker compose down > /dev/null 2>&1 || true
docker builder prune -f > /dev/null 2>&1 || true
rm -rf frontend/dist frontend/node_modules/.cache > /dev/null 2>&1 || true

# Build and start Docker services with fresh frontend
print_info "Building and starting services..."
docker compose build --no-cache frontend
docker compose up -d --build

# Wait for databases to be ready
print_info "Waiting for databases to be ready..."
sleep 10

# Initialize databases (only if not already initialized)
initialize_databases

# Create logs directory
mkdir -p logs

# Setup fine-tuning service if on Apple Silicon
if [[ $(uname -m) == "arm64" ]] && command -v python3 &> /dev/null; then
    print_info "Setting up fine-tuning service..."

    cd fine_tune_service

    # Check if virtual environment exists
    if [ ! -d "fine_tune_env" ]; then
        print_info "Creating Python virtual environment..."
        python3 -m venv fine_tune_env
    fi

    # Activate virtual environment and install dependencies
    source fine_tune_env/bin/activate
    print_info "Installing fine-tuning dependencies..."
    pip install -r requirements.txt

    # Start fine-tuning services
    print_info "Starting fine-tuning API service..."
    nohup ./fine_tune_env/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8400 > ../logs/fine_tune_api.log 2>&1 &
    API_PID=$!
    echo $API_PID > ../logs/fine_tune_api.pid

    # Give API a moment to start
    sleep 3

    print_info "Starting Celery worker..."
    nohup ./fine_tune_env/bin/celery -A app.celery_app.celery_app worker --loglevel=INFO --concurrency=1 > ../logs/celery.log 2>&1 &
    CELERY_PID=$!
    echo $CELERY_PID > ../logs/celery.pid

    # Give Celery a moment to start
    sleep 2

    cd ..

    print_status "Fine-tuning services started!"
else
    print_warning "Fine-tuning service skipped (requires Apple Silicon + Python3)"
fi



print_status "AI Platform is ready!"
echo ""
print_info "Services available at:"
echo "  • Frontend:        http://localhost:3000"
echo "  • Product API:     http://localhost:8200"
echo "  • Workflow Engine: http://localhost:8100"
echo "  • n8n:            http://localhost:5678"
echo "  • Qdrant:         http://localhost:6333"

if [[ $(uname -m) == "arm64" ]] && command -v python3 &> /dev/null; then
    echo "  • Fine-tuning API: http://localhost:8400"
fi

echo ""
print_info "Useful commands:"
echo "  • View Docker logs:     docker compose logs -f"
echo "  • Stop Docker services: docker compose down"

if [[ $(uname -m) == "arm64" ]] && command -v python3 &> /dev/null; then
    echo "  • View fine-tune logs:  tail -f logs/fine_tune_api.log"
    echo "  • View Celery logs:     tail -f logs/celery.log"
    echo "  • Stop fine-tune:       ./stop_fine_tune.sh"
fi
