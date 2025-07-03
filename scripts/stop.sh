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

# Stop containers
echo "🐳 Stopping Docker containers..."

# Stop all profiles to ensure everything is stopped
echo "   Stopping local database containers..."
docker-compose --profile local-db down 2>/dev/null

echo "   Stopping Atlas containers..."  
docker-compose --profile atlas down 2>/dev/null

echo "   Stopping any remaining containers..."
docker-compose down 2>/dev/null

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
