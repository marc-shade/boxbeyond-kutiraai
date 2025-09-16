#!/bin/bash

# KutiraAI Service Shutdown Script

echo "════════════════════════════════════════════════"
echo "        Stopping KutiraAI Services               "
echo "════════════════════════════════════════════════"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Stop services by PID files if they exist
if [ -d ".pids" ]; then
    for pidfile in .pids/*.pid; do
        if [ -f "$pidfile" ]; then
            PID=$(cat "$pidfile")
            SERVICE=$(basename "$pidfile" .pid)
            if kill -0 $PID 2>/dev/null; then
                kill -9 $PID
                echo -e "${GREEN}✓${NC} Stopped $SERVICE (PID: $PID)"
            fi
            rm "$pidfile"
        fi
    done
fi

# Also kill any remaining processes on known ports
PORTS=(3001 3002 8000 9201 9202)

for PORT in "${PORTS[@]}"; do
    PID=$(lsof -ti:$PORT)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null
        echo -e "${YELLOW}⚠${NC}  Stopped process on port $PORT"
    fi
done

echo ""
echo -e "${GREEN}✓${NC} All services stopped"
echo ""