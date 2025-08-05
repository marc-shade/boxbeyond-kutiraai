#!/bin/bash

# =============================================================================
# AI Platform Setup Script
# =============================================================================
# Usage: ./start.sh [--import-workflows] [--skip-frontend-build]
#   --import-workflows       Import 6 n8n workflows with confirmation (overwrites existing)
#   --skip-frontend-build    Skip frontend rebuild (uses existing build for faster startup)

set -e  # Exit on any error

# Parse command line arguments
BUILD_FRONTEND=true  # Default to true, can be disabled with --skip-frontend-build

for arg in "$@"; do
    case $arg in
        --skip-frontend-build)
            BUILD_FRONTEND=false
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-frontend-build    Skip frontend rebuild (uses existing build for faster startup)"
            echo "  --help, -h              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Start platform (rebuilds frontend and auto-imports missing workflows)"
            echo "  $0 --skip-frontend-build     # Start platform with existing frontend build (faster)"
            echo ""
            echo "Note: Workflows are automatically imported if they don't exist in n8n database"
            exit 0
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

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

# Show startup mode
print_info "Startup configuration:"
if [ "$BUILD_FRONTEND" = true ]; then
    echo "  • Frontend: Will rebuild from scratch"
else
    echo "  • Frontend: Using existing build"
fi
echo "  • Workflows: Auto-import missing workflows (checks n8n database)"
echo ""

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
    print_info "Download from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Desktop."
    print_info "Download from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check Ollama
if ! command -v ollama &> /dev/null; then
    print_error "Ollama is not installed. Please install Ollama for AI model management."
    print_info "Install Ollama: https://ollama.ai/download"
    print_info "After installation, you can pull models with: ollama pull llama3.2"
    exit 1
fi

# Check Python3
if ! command -v python3 &> /dev/null; then
    print_error "Python3 is not installed. Please install Python 3.11 or later."
    print_info "Install Python: brew install python@3.11 (macOS) or apt-get install python3 (Ubuntu)"
    exit 1
fi

# Check curl
if ! command -v curl &> /dev/null; then
    print_error "curl is not installed. Please install curl for n8n workflow import."
    exit 1
fi

# Check jq
if ! command -v jq &> /dev/null; then
    print_error "jq is not installed. Please install jq for n8n workflow import."
    print_info "Install jq: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    exit 1
fi

print_status "All prerequisites are available: Docker, Docker Compose, Ollama, Python3, curl, and jq"

# Function to debug n8n connectivity
debug_n8n_connectivity() {
    print_info "Debugging n8n connectivity..."

    # Check if n8n container is running
    if docker ps | grep -q "n8n-processflow"; then
        print_status "n8n container is running"
    else
        print_error "n8n container is not running"
        return 1
    fi

    # Check if port 5678 is accessible
    if nc -z localhost 5678 2>/dev/null; then
        print_status "Port 5678 is accessible"
    else
        print_warning "Port 5678 is not accessible"
    fi

    # Check n8n logs for any obvious errors
    print_info "Recent n8n logs:"
    docker logs --tail 10 n8n-processflow 2>/dev/null || print_warning "Could not retrieve n8n logs"
}

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

# Function to check if workflow exists in n8n database
check_workflow_exists() {
    local workflow_name="$1"
    local exists=$(docker exec postgres-n8n psql -U ${N8N_POSTGRES_USER} -d ${N8N_POSTGRES_DB} -tAc "SELECT EXISTS (SELECT 1 FROM workflow_entity WHERE name = '$workflow_name');" 2>/dev/null || echo "false")
    echo "$exists"
}

# Function to import n8n workflows (only missing ones)
import_n8n_workflows() {
    print_info "Checking and importing missing n8n workflows..."

    # Test n8n connectivity first using the home/workflows endpoint
    API_TEST=$(curl -s -w "%{http_code}" "http://localhost:5678/home/workflows" 2>/dev/null)
    HTTP_CODE="${API_TEST: -3}"

    if [ "$HTTP_CODE" != "200" ]; then
        print_warning "n8n not accessible (HTTP $HTTP_CODE), skipping workflow import"
        return 1
    fi

    # Arrays of workflow names and files (parallel arrays)
    WORKFLOW_NAMES=(
        "Agentic Workflow"
        "Dataset Generator Sub Process"
        "Dataset Generator - Google Drive"
        "Dataset Generator - Local Drive"
        "RAG Workflow"
        "Update Knowledge Base"
    )

    WORKFLOW_FILES=(
        "platform_services/n8n-workflows/Agentic_Workflow.json"
        "platform_services/n8n-workflows/Dataset_Generator_Sub_Process.json"
        "platform_services/n8n-workflows/Dataset_Generator___Google_Drive.json"
        "platform_services/n8n-workflows/Dataset_Generator___Local_Drive.json"
        "platform_services/n8n-workflows/RAG_Workflow.json"
        "platform_services/n8n-workflows/Update_Knowledge_Base.json"
    )

    IMPORTED_COUNT=0
    FAILED_COUNT=0
    SKIPPED_COUNT=0

    print_info "Checking existing workflows in n8n database..."

    for i in "${!WORKFLOW_NAMES[@]}"; do
        workflow_name="${WORKFLOW_NAMES[$i]}"
        workflow_file="${WORKFLOW_FILES[$i]}"

        if [ -f "$workflow_file" ]; then
            # Check if workflow already exists in database
            workflow_exists=$(check_workflow_exists "$workflow_name")

            if [ "$workflow_exists" = "t" ] || [ "$workflow_exists" = "true" ]; then
                print_info "Skipping '$workflow_name' - already exists in n8n"
                SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
            else
                print_info "Importing missing workflow: $workflow_name"

                # Copy workflow file to n8n container and import using CLI
                if docker cp "$workflow_file" n8n-processflow:/tmp/workflow.json 2>/dev/null; then
                    # Import workflow using n8n CLI inside the container
                    IMPORT_OUTPUT=$(docker exec n8n-processflow n8n import:workflow --input=/tmp/workflow.json 2>&1)
                    IMPORT_EXIT_CODE=$?

                    if [ $IMPORT_EXIT_CODE -eq 0 ]; then
                        print_status "Successfully imported: $workflow_name"
                        IMPORTED_COUNT=$((IMPORTED_COUNT + 1))
                    else
                        print_warning "Failed to import: $workflow_name"
                        print_info "  Error: $IMPORT_OUTPUT"
                        FAILED_COUNT=$((FAILED_COUNT + 1))
                    fi

                    # Clean up temporary file
                    docker exec n8n-processflow rm -f /tmp/workflow.json 2>/dev/null || true
                else
                    print_warning "Failed to copy workflow file to container: $workflow_name"
                    FAILED_COUNT=$((FAILED_COUNT + 1))
                fi
            fi
        else
            print_warning "Workflow file not found: $workflow_file"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi

        # Small delay between operations
        sleep 1
    done

    # Summary
    TOTAL_WORKFLOWS=6
    print_status "Workflow check completed: $IMPORTED_COUNT imported, $SKIPPED_COUNT skipped, $FAILED_COUNT failed (Total: $TOTAL_WORKFLOWS)"

    if [ $IMPORTED_COUNT -gt 0 ]; then
        print_status "Successfully imported $IMPORTED_COUNT new workflows"
    fi

    if [ $SKIPPED_COUNT -gt 0 ]; then
        print_info "$SKIPPED_COUNT workflows already exist and were preserved"
    fi

    if [ $FAILED_COUNT -gt 0 ]; then
        print_warning "$FAILED_COUNT workflows failed to import - check n8n logs for details"
    fi

    if [ $((IMPORTED_COUNT + SKIPPED_COUNT)) -eq $TOTAL_WORKFLOWS ]; then
        print_status "All workflows are now available in n8n"
    fi

    print_info "You can access your workflows at http://localhost:5678"
}

# Check system architecture for fine-tuning and Celery services
print_info "Checking system architecture for fine-tuning capabilities..."
APPLE_SILICON=false
SKIP_FINE_TUNING=false

if [[ $(uname -m) == "arm64" ]]; then
    APPLE_SILICON=true
    print_status "Apple Silicon detected ($(uname -m)) - fine-tuning and Celery services will be available"
else
    print_warning "Non-Apple Silicon detected ($(uname -m)) - fine-tuning requires Apple Silicon (M1/M2/M3/M4)"
    print_info "Fine-tuning and Celery services will be skipped on this system"
    print_info "Other platform services will work normally"
    SKIP_FINE_TUNING=true
fi

# Start the platform
print_info "Starting AI Platform Docker services..."

# Stop any running containers
print_info "Stopping existing services..."
docker compose down > /dev/null 2>&1 || true

# Conditional frontend build
if [ "$BUILD_FRONTEND" = true ]; then
    print_info "Building fresh frontend (default behavior)..."
    docker builder prune -f > /dev/null 2>&1 || true
    rm -rf frontend/dist frontend/node_modules/.cache > /dev/null 2>&1 || true

    # Build and start Docker services with fresh frontend
    print_info "Building and starting services with fresh frontend..."
    docker compose build --no-cache frontend
    docker compose up -d --build
else
    print_info "Skipping frontend build - using existing build for faster startup"
    print_info "Starting services..."
    docker compose up -d
fi

# Wait for databases to be ready
print_info "Waiting for databases to be ready..."
sleep 10

# Initialize databases (only if not already initialized)
initialize_databases

# Wait for n8n to be ready and import workflows
print_info "Waiting for n8n to be ready..."
sleep 20

# Check if n8n is responding - try multiple endpoints and methods
N8N_READY=false
print_info "Checking n8n readiness..."

for i in {1..60}; do
    # Try the main n8n interface first (simpler check)
    if curl -s -f "http://localhost:5678" > /dev/null 2>&1; then
        print_info "n8n web interface is responding, checking workflows page..."
        sleep 2

        # Now try the workflows page endpoint (doesn't require auth)
        if curl -s "http://localhost:5678/home/workflows" > /dev/null 2>&1; then
            N8N_READY=true
            break
        fi
    fi

    if [ $((i % 10)) -eq 0 ]; then
        print_info "Still waiting for n8n... (attempt $i/60)"
    fi
    sleep 3
done

if [ "$N8N_READY" = true ]; then
    print_status "n8n is ready"

    # Always check and import missing workflows
    print_info "Checking for missing workflows and importing them automatically..."
    import_n8n_workflows
else
    print_warning "n8n is not responding after 3 minutes, skipping workflow import"
    debug_n8n_connectivity
    print_info "You can manually import workflows later using the n8n interface at http://localhost:5678"
    print_info "Or try running the import manually after n8n is fully ready"
fi

# Create logs directory
mkdir -p logs

# Setup fine-tuning service if on Apple Silicon
if [ "$SKIP_FINE_TUNING" = false ]; then
    print_info "Setting up fine-tuning and Celery services..."

    # Check if fine_tune_service directory exists
    if [ ! -d "fine_tune_service" ]; then
        print_warning "fine_tune_service directory not found - skipping fine-tuning setup"
        print_info "Fine-tuning services will not be available"
    else
        cd fine_tune_service

        # Check if virtual environment exists
        if [ ! -d "fine_tune_env" ]; then
            print_info "Creating Python virtual environment..."
            if ! python3 -m venv fine_tune_env; then
                print_error "Failed to create Python virtual environment"
                print_warning "Fine-tuning services will not be available"
                cd ..
                SKIP_FINE_TUNING=true
            fi
        fi

        if [ "$SKIP_FINE_TUNING" = false ]; then
            # Activate virtual environment and install dependencies
            source fine_tune_env/bin/activate
            print_info "Installing fine-tuning dependencies..."

            if [ -f "requirements.txt" ]; then
                if ! pip install -r requirements.txt > /dev/null 2>&1; then
                    print_warning "Some dependencies failed to install - fine-tuning may not work properly"
                fi
            else
                print_warning "requirements.txt not found - fine-tuning may not work properly"
            fi

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

            print_status "Fine-tuning and Celery services started successfully!"
        fi
    fi
else
    print_info "Fine-tuning and Celery services skipped (requires Apple Silicon)"
    print_info "Platform will run without fine-tuning capabilities"
fi



print_status "AI Platform is ready!"
echo ""
print_info "Services available at:"
echo "  • Frontend:        http://localhost:3000"
echo "  • Product API:     http://localhost:8200"
echo "  • Workflow Engine: http://localhost:8100"
echo "  • n8n:            http://localhost:5678 (with pre-imported workflows)"
echo "  • Qdrant:         http://localhost:6333"

if [ "$SKIP_FINE_TUNING" = false ] && [ -d "fine_tune_service" ]; then
    echo "  • Fine-tuning API: http://localhost:8400"
fi

echo ""
print_info "System capabilities:"
if [ "$APPLE_SILICON" = true ]; then
    echo "  • Apple Silicon:   ✓ Fine-tuning and Celery services available"
else
    echo "  • Architecture:    $(uname -m) - Fine-tuning requires Apple Silicon"
fi

echo ""
print_info "Useful commands:"
echo "  • View Docker logs:     docker compose logs -f"
echo "  • Stop Docker services: docker compose down"
echo "  • Fast restart:         ./start.sh --skip-frontend-build"
echo "  • Manual import:        ./import_n8n_workflows.sh"

if [ "$SKIP_FINE_TUNING" = false ] && [ -d "fine_tune_service" ]; then
    echo "  • View fine-tune logs:  tail -f logs/fine_tune_api.log"
    echo "  • View Celery logs:     tail -f logs/celery.log"
    echo "  • Stop fine-tune:       ./stop_fine_tune.sh"
fi
