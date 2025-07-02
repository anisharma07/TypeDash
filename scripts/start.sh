#!/bin/bash

# Type Dash - Start Script
# This script starts the application and verifies all services are running

echo "🚀 Starting Type Dash Application..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "⏳ Waiting for $service_name to be ready"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e "\n✅ $service_name is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "\n❌ $service_name failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# Function to check MongoDB connection
check_mongodb() {
    echo "🔍 Checking MongoDB connection..."
    
    # Try to connect to MongoDB and run a simple command
    if docker exec type-dash_mongo_1 mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ MongoDB is running and accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ MongoDB connection failed${NC}"
        return 1
    fi
}

# Function to display service status
show_status() {
    echo ""
    echo "📊 Service Status:"
    echo "=================="
    
    # Check Docker containers
    echo "🐳 Docker Containers:"
    docker ps --filter "name=type-dash" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "🌐 Service URLs:"
    echo "  • Application: http://localhost:2360"
    echo "  • MongoDB:     mongodb://localhost:2701"
    
    echo ""
    echo "📁 Volume Status:"
    docker volume ls --filter "name=type-dash"
}

# Main execution
echo "🛠️  Building and starting containers..."

# Start Docker Compose
if docker-compose up --build -d; then
    echo -e "${GREEN}✅ Docker containers started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start Docker containers${NC}"
    exit 1
fi

echo ""
echo "🔍 Verifying services..."

# Wait for application to be ready
if wait_for_service "http://localhost:2360" "Type Dash Application"; then
    echo -e "${GREEN}✅ Application server is running${NC}"
else
    echo -e "${RED}❌ Application server failed to start${NC}"
    echo "📋 Checking logs..."
    docker-compose logs app
    exit 1
fi

# Check MongoDB
if check_mongodb; then
    echo -e "${GREEN}✅ MongoDB is working properly${NC}"
else
    echo -e "${RED}❌ MongoDB check failed${NC}"
    echo "📋 Checking MongoDB logs..."
    docker-compose logs mongo
    exit 1
fi

# Show final status
show_status

echo ""
echo -e "${GREEN}🎉 Type Dash is ready!${NC}"
echo "=================================="
echo -e "${BLUE}🌐 Open your browser and visit: http://localhost:2360${NC}"
echo -e "${YELLOW}📊 To view logs: docker-compose logs -f${NC}"
echo -e "${YELLOW}🛑 To stop: docker-compose down${NC}"
echo ""
