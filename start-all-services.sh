#!/bin/bash

# KutiraAI Multi-Service Startup Script
# Intelligently manages multiple development servers with port conflict resolution

echo "════════════════════════════════════════════════"
echo "     KutiraAI Development Environment Manager    "
echo "════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    lsof -i:$1 > /dev/null 2>&1
    return $?
}

# Function to kill process on port
kill_port() {
    local PID=$(lsof -ti:$1)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null
        echo -e "${YELLOW}⚠${NC}  Cleared existing process on port $1"
    fi
}

# Function to find next available port
find_available_port() {
    local PORT=$1
    while check_port $PORT; do
        PORT=$((PORT + 1))
    done
    echo $PORT
}

# Service configuration
declare -A SERVICES
SERVICES["frontend"]="3001:npm start:Vite Frontend"
SERVICES["api"]="3002:node api-server.js:MCP API Server"
SERVICES["backend"]="8000:node backend-mock.js:Mock Backend Services"

# Additional mock service ports handled by backend-mock.js
MOCK_PORTS="9201:Agentic Workflow,9202:Fine-tune API"

echo "Checking port availability..."
echo ""

# Track what ports we're actually using
declare -A ACTUAL_PORTS

# Check and handle each service
for service in "${!SERVICES[@]}"; do
    IFS=':' read -r port command description <<< "${SERVICES[$service]}"

    if check_port $port; then
        echo -e "${YELLOW}⚠${NC}  Port $port is in use for $description"
        read -p "Kill existing process? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill_port $port
        else
            # Find alternative port
            NEW_PORT=$(find_available_port $((port + 10)))
            echo -e "${BLUE}ℹ${NC}  Using alternative port $NEW_PORT for $description"
            ACTUAL_PORTS[$service]=$NEW_PORT
            port=$NEW_PORT
        fi
    else
        ACTUAL_PORTS[$service]=$port
    fi
done

# Create .env.local with actual ports being used
cat > .env.local << EOF
# Auto-generated port configuration
# Generated: $(date)
VITE_FRONTEND_PORT=${ACTUAL_PORTS["frontend"]:-3001}
VITE_API_PORT=${ACTUAL_PORTS["api"]:-3002}
VITE_BACKEND_PORT=${ACTUAL_PORTS["backend"]:-8000}
VITE_API_URL=http://localhost:${ACTUAL_PORTS["api"]:-3002}
VITE_BACKEND_URL=http://localhost:${ACTUAL_PORTS["backend"]:-8000}
EOF

echo -e "${GREEN}✓${NC} Port configuration saved to .env.local"
echo ""

# Function to start service in background
start_service() {
    local name=$1
    local command=$2
    local port=$3

    echo -e "Starting $name on port ${BLUE}$port${NC}..."

    # Run in background and save PID
    nohup $command > logs/${name}.log 2>&1 &
    local PID=$!

    # Save PID for later cleanup
    echo $PID > .pids/${name}.pid

    # Wait a moment to check if it started
    sleep 2

    if kill -0 $PID 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $name started (PID: $PID)"
        return 0
    else
        echo -e "${RED}✗${NC} Failed to start $name"
        return 1
    fi
}

# Create necessary directories
mkdir -p logs .pids

echo "Starting services..."
echo ""

# Start Frontend (Vite)
cd /Volumes/FILES/code/kutiraai
start_service "frontend" "npm start" ${ACTUAL_PORTS["frontend"]:-3001}

# Start API Server
start_service "api" "node api-server.js" ${ACTUAL_PORTS["api"]:-3002}

# Start Backend Mock (handles multiple ports)
start_service "backend" "node backend-mock.js" ${ACTUAL_PORTS["backend"]:-8000}

echo ""
echo "════════════════════════════════════════════════"
echo "          All Services Started Successfully      "
echo "════════════════════════════════════════════════"
echo ""
echo "Service URLs:"
echo -e "  ${GREEN}Frontend:${NC}          http://localhost:${ACTUAL_PORTS["frontend"]:-3001}"
echo -e "  ${GREEN}API Server:${NC}        http://localhost:${ACTUAL_PORTS["api"]:-3002}"
echo -e "  ${GREEN}Backend Mock:${NC}      http://localhost:${ACTUAL_PORTS["backend"]:-8000}"
echo -e "  ${GREEN}Agentic Workflow:${NC}  http://localhost:9201"
echo -e "  ${GREEN}Fine-tune API:${NC}     http://localhost:9202"
echo ""
echo "Logs are available in the ./logs directory"
echo ""
echo "To stop all services, run: ./stop-all-services.sh"
echo ""