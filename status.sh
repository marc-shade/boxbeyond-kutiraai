#!/bin/bash

# =============================================================================
# AI Platform Status Check Script
# =============================================================================

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
echo "                        AI Platform Status"
echo "============================================================================="
echo -e "${NC}"

# Check Docker services
print_info "Docker Services Status:"
echo "------------------------"
docker compose ps

echo ""
print_info "Service Health Checks:"
echo "----------------------"

# Check each service
services=(
    "http://localhost:3000|Frontend"
    "http://localhost:8200/health|Product API"
    "http://localhost:8100/health|Workflow Engine"
    "http://localhost:5678|n8n"
    "http://localhost:6333|Qdrant"
)

for service in "${services[@]}"; do
    IFS='|' read -r url name <<< "$service"
    if curl -s -f "$url" > /dev/null 2>&1; then
        print_status "$name is responding"
    else
        print_error "$name is not responding"
    fi
done

# Check fine-tuning services if on Apple Silicon
if [[ $(uname -m) == "arm64" ]]; then
    echo ""
    print_info "Fine-tuning Services Status:"
    echo "-----------------------------"
    
    # Check Fine-tuning API
    API_RUNNING=false
    if [ -f logs/fine_tune_api.pid ]; then
        PID=$(cat logs/fine_tune_api.pid 2>/dev/null)
        if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
            if curl -s -f "http://localhost:8400/health" > /dev/null 2>&1; then
                print_status "Fine-tuning API is running and responding (PID: $PID)"
                API_RUNNING=true
            else
                print_warning "Fine-tuning API is running but not responding (PID: $PID)"
                API_RUNNING=true
            fi
        fi
    fi

    # If PID file check failed, check by process name and port
    if [ "$API_RUNNING" = false ]; then
        API_PID=$(pgrep -f "uvicorn.*app.main:app.*8400" 2>/dev/null || true)
        if [ -n "$API_PID" ]; then
            if curl -s -f "http://localhost:8400/health" > /dev/null 2>&1; then
                print_status "Fine-tuning API is running and responding (PID: $API_PID) - fixed PID file"
            else
                print_warning "Fine-tuning API is running but not responding (PID: $API_PID) - fixed PID file"
            fi
            echo "$API_PID" > logs/fine_tune_api.pid
            API_RUNNING=true
        else
            # Check if port 8400 is in use
            PORT_PID=$(lsof -ti:8400 2>/dev/null || true)
            if [ -n "$PORT_PID" ]; then
                print_warning "Something is running on port 8400 (PID: $PORT_PID) but it's not the fine-tuning API"
            else
                print_error "Fine-tuning API is not running"
            fi
        fi
    fi
    
    # Check Celery Worker
    CELERY_RUNNING=false
    if [ -f logs/celery.pid ]; then
        PID=$(cat logs/celery.pid 2>/dev/null)
        if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
            print_status "Celery worker is running (PID: $PID)"
            CELERY_RUNNING=true
        fi
    fi

    # If PID file check failed, check by process name
    if [ "$CELERY_RUNNING" = false ]; then
        CELERY_PID=$(pgrep -f "celery.*app.celery_app.celery_app.*worker" 2>/dev/null || true)
        if [ -n "$CELERY_PID" ]; then
            print_status "Celery worker is running (PID: $CELERY_PID) - fixed PID file"
            echo "$CELERY_PID" > logs/celery.pid
            CELERY_RUNNING=true
        else
            print_error "Celery worker is not running"
        fi
    fi
fi

echo ""
print_info "Recent logs (last 5 lines):"
echo "----------------------------"

if [ -f logs/fine_tune_api.log ]; then
    echo "Fine-tuning API:"
    tail -n 5 logs/fine_tune_api.log
    echo ""
fi

if [ -f logs/celery.log ]; then
    echo "Celery Worker:"
    tail -n 5 logs/celery.log
    echo ""
fi
