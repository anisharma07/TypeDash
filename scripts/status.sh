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
if docker ps --filter "name=typedash" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q "typedash"; then
    docker ps --filter "name=typedash" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${RED}❌ No Type Dash containers running${NC}"
fi

echo ""
echo "🌐 Service Health:"

# Check application
check_service_health "http://localhost:2360" "Type Dash Application"

# Check database configuration and status
echo -n "🗄️  Database: "
if [ -f ".env" ] && grep -q "mongodb+srv" .env 2>/dev/null; then
    echo -e "${BLUE}MongoDB Atlas (Cloud)${NC}"
    echo -n "   Connection: "
    # For Atlas, we can't directly check but we assume if app is running, DB is working
    if curl -s "http://localhost:2360" >/dev/null 2>&1; then
        echo -e "${GREEN}Assumed Working${NC}"
    else
        echo -e "${RED}Unknown (App not responding)${NC}"
    fi
else
    echo -e "${BLUE}Local MongoDB${NC}"
    echo -n "   Status: "
    if docker exec typedash_mongo_1 mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        echo -e "${GREEN}Running${NC}"
    else
        echo -e "${RED}Not responding${NC}"
    fi
fi

echo ""
echo "📁 Volumes:"
if docker volume ls --filter "name=typedash" | grep -q "typedash"; then
    docker volume ls --filter "name=typedash"
else
    echo "No TypeDash volumes found"
fi

echo ""
echo "🌐 Access URLs:"
echo "  • Application: http://localhost:2360"
if [ -f ".env" ] && grep -q "mongodb+srv" .env 2>/dev/null; then
    echo "  • Database:    MongoDB Atlas (Cloud)"
else
    echo "  • MongoDB:     mongodb://localhost:2701"
fi

echo ""
echo "📋 Quick Commands:"
echo "  • View logs:   docker-compose logs -f"
echo "  • Restart:     ./scripts/stop.sh && ./scripts/start.sh"
echo "  • Reconfigure: ./scripts/start.sh --setup"
echo "  • Stop:        ./scripts/stop.sh"
echo ""
