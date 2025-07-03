#!/bin/bash

# Type Dash - Start Script
# This script starts the application and verifies all services are running
# 
# Usage:
#   ./start.sh         - Auto-detect database configuration and start
#   ./start.sh --setup - Interactive daecho ""
#   ./start.sh -s      - Same as --setup

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
    if docker exec typedash_mongo_1 mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
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
    docker ps --filter "name=typedash" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    
    # Get network IP addresses
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "Unable to detect")
    
    if [ "$USE_ATLAS" = true ]; then
        echo "🌐 Service URLs:"
        echo "  • Local:       http://localhost:2360"
        echo "  • Network IP:  http://${LOCAL_IP}:2360"
        echo "  • Public IP:   http://${PUBLIC_IP}:2360 (if port forwarded)"
        echo "  • Database:    MongoDB Atlas (Cloud)"
    else
        echo "🌐 Service URLs:"
        echo "  • Local:       http://localhost:2360"
        echo "  • Network IP:  http://${LOCAL_IP}:2360"
        echo "  • Public IP:   http://${PUBLIC_IP}:2360 (if port forwarded)"
        echo "  • MongoDB:     mongodb://localhost:2701"
        echo "  • MongoDB IP:  mongodb://${LOCAL_IP}:2701"
        
        echo ""
        echo "📁 Volume Status:"
        docker volume ls --filter "name=typedash"
    fi
}

# Function to setup database configuration
setup_database() {
    echo ""
    echo "�️  Database Configuration Setup"
    echo "================================="
    echo ""
    echo "Choose your database option:"
    echo "1) Local MongoDB (Docker) - Recommended for development"
    echo "2) MongoDB Atlas (Cloud) - Recommended for production"
    echo "3) Auto-detect from existing configuration"
    echo ""
    
    read -p "Enter your choice (1, 2, or 3): " choice
    
    case $choice in
        1)
            echo ""
            echo "📍 Selected: Local MongoDB"
            if [ -f ".env" ]; then
                echo "⚠️  Removing existing .env file to use default local configuration"
                rm .env
            fi
            USE_ATLAS=false
            ;;
        2)
            echo ""
            echo "☁️  Selected: MongoDB Atlas"
            
            if [ ! -f ".env" ]; then
                echo "📝 Creating .env file from template..."
                cp .env.example .env
            fi
            
            echo ""
            echo "⚠️  IMPORTANT: MongoDB Atlas Setup Required!"
            echo "   1. Go to https://www.mongodb.com/atlas"
            echo "   2. Create account and free cluster"
            echo "   3. Get your connection string"
            echo "   4. Replace MONGODB_URI in .env file with your Atlas connection string"
            echo ""
            echo "📝 Current .env file location: $(pwd)/.env"
            echo ""
            read -p "Press Enter when you've updated the .env file with your Atlas connection string..."
            
            if [ -f ".env" ] && grep -q "mongodb+srv" .env 2>/dev/null; then
                echo "✅ Atlas configuration detected in .env file"
                USE_ATLAS=true
            else
                echo "⚠️  Warning: No Atlas configuration detected. Falling back to local MongoDB."
                USE_ATLAS=false
            fi
            ;;
        3)
            echo ""
            echo "� Auto-detecting database configuration..."
            if [ -f ".env" ] && grep -q "mongodb+srv" .env 2>/dev/null; then
                echo "✅ Found MongoDB Atlas configuration"
                USE_ATLAS=true
            else
                echo "✅ Using local MongoDB configuration"
                USE_ATLAS=false
            fi
            ;;
        *)
            echo "❌ Invalid choice. Using local MongoDB as default."
            USE_ATLAS=false
            ;;
    esac
}

# Main execution
echo "🛠️  Building and starting containers..."

# Check if this is first run or if user wants to reconfigure
if [ "$1" = "--setup" ] || [ "$1" = "-s" ]; then
    setup_database
elif [ -f ".env" ] && grep -q "mongodb+srv" .env 2>/dev/null; then
    echo "🔍 Detected MongoDB Atlas configuration"
    USE_ATLAS=true
else
    echo "🔍 Using local MongoDB database"
    USE_ATLAS=false
fi

# Start containers based on configuration
if [ "$USE_ATLAS" = true ]; then
    echo "🚀 Starting with cloud database..."
    if docker-compose --profile atlas up --build -d; then
        echo -e "${GREEN}✅ Docker containers started successfully (Atlas mode)${NC}"
    else
        echo -e "${RED}❌ Failed to start Docker containers${NC}"
        exit 1
    fi
else
    echo "🚀 Starting with local database..."
    if docker-compose --profile local-db up --build -d; then
        echo -e "${GREEN}✅ Docker containers started successfully (Local mode)${NC}"
    else
        echo -e "${RED}❌ Failed to start Docker containers${NC}"
        exit 1
    fi
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
if [ "$USE_ATLAS" = true ]; then
    echo "☁️  Using MongoDB Atlas - skipping local MongoDB check"
    echo -e "${GREEN}✅ MongoDB Atlas connection assumed working${NC}"
else
    if check_mongodb; then
        echo -e "${GREEN}✅ MongoDB is working properly${NC}"
    else
        echo -e "${RED}❌ MongoDB check failed${NC}"
        echo "📋 Checking MongoDB logs..."
        docker-compose logs mongo
        exit 1
    fi
fi

# Show final status
show_status

echo ""
echo -e "${GREEN}🎉 Type Dash is ready!${NC}"
echo "=================================="
echo -e "${BLUE}🌐 Open your browser and visit: http://localhost:2360${NC}"
echo ""
echo "📋 Useful commands:"
echo -e "${YELLOW}📊 View logs:        docker-compose logs -f${NC}"
echo -e "${YELLOW}� Check status:     ./scripts/status.sh${NC}"
echo -e "${YELLOW}🛑 Stop application: ./scripts/stop.sh${NC}"
echo -e "${YELLOW}🔄 Reconfigure DB:   ./scripts/start.sh --setup${NC}"
echo ""
