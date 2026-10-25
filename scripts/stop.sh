#!/bin/bash

# Type Dash - Stop Script
# This script stops the application gracefully

echo "🛑 Stopping Type Dash Application..."
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# cd to the repo root and pick the Compose command ($COMPOSE)
source "$(dirname "$0")/compose.sh"

# Stop containers
echo "🐳 Stopping Docker containers..."

# Enable both profiles so one `down` stops the app, the local database and the shared network.
# Compose only acts on services whose profile is enabled, so a bare `down` would stop nothing.
echo "   Stopping local database and Atlas containers..."
$COMPOSE --profile local-db --profile atlas down 2>/dev/null

# Check if any TypeDash containers are still running
if docker ps --filter "name=typedash" | grep -q "typedash"; then
    echo -e "${YELLOW}⚠️  Some containers still running, forcing stop...${NC}"
    docker stop $(docker ps --filter "name=typedash" -q) 2>/dev/null
fi

echo -e "${GREEN}✅ All containers stopped successfully${NC}"

echo ""
echo -e "${GREEN}✅ Type Dash application stopped${NC}"
echo -e "${YELLOW}💡 To start again, run: ./scripts/start.sh${NC}"
echo -e "${YELLOW}🔧 To reconfigure database: ./scripts/start.sh --setup${NC}"
echo ""
