#!/bin/bash

# Configuration
VENV_NAME="fine_tune_env"
REQUIREMENTS_FILE="requirements.txt"
API_HOST="0.0.0.0"
API_PORT="8400"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() { echo -e "${GREEN}[+] $1${NC}"; }
print_warning() { echo -e "${YELLOW}[!] $1${NC}"; }
print_error() { echo -e "${RED}[-] $1${NC}"; }

# Check if python3 is installed
if ! command -v python3 &>/dev/null; then
    print_error "Python3 is not installed"
    exit 1
fi

setup_environment() {
    # Create virtual environment if it doesn't exist
    if [ ! -d "${VENV_NAME}" ]; then
        print_status "Creating new virtual environment '${VENV_NAME}'..."
        python3 -m venv ${VENV_NAME}
    fi

    # Activate virtual environment
    source "${VENV_NAME}/bin/activate"

    # Install requirements
    print_status "Installing requirements..."
    pip install -r "$REQUIREMENTS_FILE"
}

kill_port_process() {
    local port=$1
    local pid

    # Try using lsof
    if command -v lsof >/dev/null 2>&1; then
        pid=$(lsof -ti :$port)
    # Try using netstat for Linux
    elif command -v netstat >/dev/null 2>&1; then
        pid=$(netstat -tulpn 2>/dev/null | grep ":$port" | awk '{print $7}' | cut -d'/' -f1)
    # Try using ss for newer Linux systems
    elif command -v ss >/dev/null 2>&1; then
        pid=$(ss -tulpn | grep ":$port" | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2)
    fi

    if [ ! -z "$pid" ]; then
        print_warning "Found process (PID: $pid) using port $port. Killing it..."
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1 || \
       netstat -tuln 2>/dev/null | grep -q ":$port " || \
       ss -tuln 2>/dev/null | grep -q ":$port "
    then
        return 1
    fi
    return 0
}

start_services() {
    mkdir -p logs
    
    # Check if port is available
    if ! check_port $API_PORT; then
        print_error "Port $API_PORT is already in use. Please stop any existing services first."
        exit 1
    fi

    # Activate virtual environment
    source "${VENV_NAME}/bin/activate"

    # Get the path to the virtual environment's Python interpreter
    VENV_PYTHON="${VENV_NAME}/bin/python"

    # Start Celery worker
    print_status "Starting Celery worker..."
    "${VENV_NAME}/bin/celery" \
        -A app.celery_app.celery_app \
        worker \
        --loglevel=INFO \
        --logfile=logs/celery.log \
        --pidfile=logs/celery.pid \
        --detach

    # Start FastAPI
    print_status "Starting FastAPI application..."
    nohup "${VENV_PYTHON}" -m uvicorn \
        app.main:app \
        --host $API_HOST \
        --port $API_PORT \
        --reload > logs/api.log 2>&1 &

    echo $! > logs/api.pid

    # Wait a moment for the service to start
    sleep 3

    # Check if FastAPI is running
    if ! ps -p $(cat logs/api.pid) >/dev/null 2>&1; then
        print_error "FastAPI failed to start. Check logs/api.log for details:"
        tail -n 10 logs/api.log
        exit 1
    fi

    # Verify the service is responding
    if curl -s "http://$API_HOST:$API_PORT/docs" >/dev/null 2>&1; then
        print_status "FastAPI service is up and running on http://$API_HOST:$API_PORT"
    else
        print_warning "FastAPI process is running but not responding. Check logs/api.log for details:"
        tail -n 10 logs/api.log
    fi

    print_status "Services started. Check logs/celery.log and logs/api.log for details"
}

stop_services() {
    print_status "Stopping services..."

    # Kill processes using the API port
    kill_port_process $API_PORT

    # Stop FastAPI
    if [ -f logs/api.pid ]; then
        if ps -p $(cat logs/api.pid) >/dev/null 2>&1; then
            kill -9 $(cat logs/api.pid) 2>/dev/null || true
        fi
        rm -f logs/api.pid
    fi

    # Stop Celery
    if [ -f logs/celery.pid ]; then
        if ps -p $(cat logs/celery.pid) >/dev/null 2>&1; then
            kill -TERM $(cat logs/celery.pid) 2>/dev/null || true
            sleep 2
            kill -9 $(cat logs/celery.pid) 2>/dev/null || true
        fi
        rm -f logs/celery.pid
    fi

    # Cleanup any remaining processes
    pkill -f "celery.*app.celery_app.celery_app" 2>/dev/null || true
    pkill -f "uvicorn.*app.main:app" 2>/dev/null || true

    # Double check the port is free
    if ! check_port $API_PORT; then
        kill_port_process $API_PORT
    fi

    # Remove all PID files
    rm -f logs/*.pid 2>/dev/null || true

    print_status "Services stopped"
    sleep 2  # Give processes time to fully stop
}

show_status() {
    echo "Service Status:"
    echo "-------------"
    
    # Check Celery
    if [ -f logs/celery.pid ] && ps -p $(cat logs/celery.pid) >/dev/null 2>&1; then
        echo "Celery: Running (PID: $(cat logs/celery.pid))"
    else
        echo "Celery: Not running"
    fi

    # Check FastAPI
    if [ -f logs/api.pid ] && ps -p $(cat logs/api.pid) >/dev/null 2>&1; then
        echo "FastAPI: Running (PID: $(cat logs/api.pid))"
        if curl -s "http://$API_HOST:$API_PORT/docs" >/dev/null 2>&1; then
            echo "FastAPI: Responding at http://$API_HOST:$API_PORT"
        else
            echo "FastAPI: Process running but not responding"
        fi
    else
        echo "FastAPI: Not running"
    fi

    # Show recent logs if they exist
    if [ -f logs/celery.log ]; then
        echo -e "\nRecent Celery logs:"
        tail -n 5 logs/celery.log
    fi

    if [ -f logs/api.log ]; then
        echo -e "\nRecent FastAPI logs:"
        tail -n 5 logs/api.log
    fi
}

case "$1" in
    start)
        setup_environment
        stop_services  # Clean up any existing services
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_services
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
