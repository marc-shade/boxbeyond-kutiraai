#!/bin/bash

# =============================================================================
# Stop Fine-tuning Services Script
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
echo "                    Stopping Fine-tuning Services"
echo "============================================================================="
echo -e "${NC}"

# Stop Fine-tuning API
if [ -f logs/fine_tune_api.pid ]; then
    PID=$(cat logs/fine_tune_api.pid 2>/dev/null)
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        print_info "Stopping Fine-tuning API (PID: $PID)..."
        kill -TERM "$PID" 2>/dev/null || true
        sleep 2
        if kill -0 "$PID" 2>/dev/null; then
            print_info "Force killing Fine-tuning API..."
            kill -9 "$PID" 2>/dev/null || true
        fi
        print_status "Fine-tuning API stopped"
    else
        print_warning "Fine-tuning API process not running (stale PID file)"
    fi
    rm -f logs/fine_tune_api.pid
else
    print_warning "Fine-tuning API PID file not found"
fi

# Stop Celery Worker
if [ -f logs/celery.pid ]; then
    PID=$(cat logs/celery.pid 2>/dev/null)
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        print_info "Stopping Celery worker (PID: $PID)..."
        kill -TERM "$PID" 2>/dev/null || true
        sleep 2
        if kill -0 "$PID" 2>/dev/null; then
            print_info "Force killing Celery worker..."
            kill -9 "$PID" 2>/dev/null || true
        fi
        print_status "Celery worker stopped"
    else
        print_warning "Celery worker process not running (stale PID file)"
    fi
    rm -f logs/celery.pid
else
    print_warning "Celery PID file not found"
fi

# Clean up any remaining processes
print_info "Cleaning up any remaining fine-tuning processes..."
pkill -f "uvicorn.*app.main:app" 2>/dev/null || true
pkill -f "celery.*app.celery_app.celery_app" 2>/dev/null || true

# Kill processes using port 8400
PORT_PID=$(lsof -ti:8400 2>/dev/null || true)
if [ -n "$PORT_PID" ]; then
    print_info "Killing process using port 8400 (PID: $PORT_PID)..."
    kill -9 "$PORT_PID" 2>/dev/null || true
fi

# Clean up any stale log files
if [ -f logs/fine_tune_api.log ]; then
    echo "" > logs/fine_tune_api.log
fi
if [ -f logs/celery.log ]; then
    echo "" > logs/celery.log
fi

print_status "Fine-tuning services stopped!"
print_info "Docker services are still running. Use 'docker compose down' to stop them."
