#!/bin/bash

# Type Dash - Status Check Script
# This script checks the current status of all services

echo "📊 Type Dash Application Status"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check service health
check_service_health() {
    local url=$1
    local service_name=$2
    
    if curl -s "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name: Running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name: Not responding${NC}"
        return 1
    fi
}

# Check Docker containers
echo "🐳 Docker Containers:"
if docker ps --filter "name=type-dash" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q "type-dash"; then
    docker ps --filter "name=type-dash" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${RED}❌ No Type Dash containers running${NC}"
fi

echo ""
echo "🌐 Service Health:"

# Check application
check_service_health "http://localhost:2360" "Type Dash Application"

# Check MongoDB
echo -n "🍃 MongoDB: "
if docker exec type-dash_mongo_1 mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    echo -e "${GREEN}Running${NC}"
else
    echo -e "${RED}Not responding${NC}"
fi

echo ""
echo "📁 Volumes:"
docker volume ls --filter "name=type-dash"

echo ""
echo "🌐 Access URLs:"
echo "  • Application: http://localhost:2360"
echo "  • MongoDB:     mongodb://localhost:2701"

echo ""
echo "📋 Quick Commands:"
echo "  • View logs:   docker-compose logs -f"
echo "  • Restart:     ./stop.sh && ./start.sh"
echo "  • Stop:        ./stop.sh"
echo ""
