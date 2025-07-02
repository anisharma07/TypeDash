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
if docker-compose down; then
    echo -e "${GREEN}✅ All containers stopped successfully${NC}"
else
    echo -e "${RED}❌ Error stopping containers${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Type Dash application stopped${NC}"
echo -e "${YELLOW}💡 To start again, run: ./start.sh${NC}"
echo ""
