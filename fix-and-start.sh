#!/bin/bash

# RAIL-PRISM Fix and Start Script
# This script fixes common issues and starts the development environment

echo "🔧 RAIL-PRISM Fix and Start Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Docker is running
print_status "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "Docker is running"

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down > /dev/null 2>&1
print_success "Existing containers stopped"

# Clean up any orphaned containers
print_status "Cleaning up orphaned containers..."
docker-compose -f docker-compose.dev.yml down --remove-orphans > /dev/null 2>&1
print_success "Orphaned containers cleaned up"

# Check and create environment files
print_status "Setting up environment files..."

# Backend environment
if [ ! -f "backend/.env" ]; then
    print_warning "Backend .env not found, creating from example..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env from example"
    else
        print_warning "Creating basic backend/.env..."
        cat > backend/.env << EOF
# Development Configuration
NODE_ENV=development
PORT=3001
WS_PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rail_prism?retryWrites=true&w=majority
REDIS_HOST=redis
REDIS_PORT=6379
KAFKA_BROKERS=kafka:29092
KAFKA_CLIENT_ID=rail-prism-backend-dev
KAFKA_GROUP_ID=rail-prism-dev-group
LOG_LEVEL=debug
JWT_SECRET=dev-super-secret-jwt-key
API_RATE_LIMIT=1000
EOF
        print_success "Created basic backend/.env"
    fi
else
    print_success "Backend .env already exists"
fi

# Frontend environment
if [ ! -f "frontend/.env" ]; then
    print_warning "Frontend .env not found, creating..."
    cat > frontend/.env << EOF
# Development Configuration
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
VITE_NODE_ENV=development
EOF
    print_success "Created frontend/.env"
else
    print_success "Frontend .env already exists"
fi

# Build images
print_status "Building Docker images..."
docker-compose -f docker-compose.dev.yml build --no-cache
if [ $? -eq 0 ]; then
    print_success "Docker images built successfully"
else
    print_error "Failed to build Docker images"
    exit 1
fi

# Start infrastructure services first
print_status "Starting infrastructure services (Redis, Kafka)..."
docker-compose -f docker-compose.dev.yml up -d redis zookeeper kafka

# Wait for services to be ready
print_status "Waiting for infrastructure services to be ready..."
sleep 20

# Check if infrastructure services are running
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up.*redis\|Up.*kafka"; then
    print_success "Infrastructure services are running"
else
    print_error "Failed to start infrastructure services"
    print_status "Checking service logs..."
    docker-compose -f docker-compose.dev.yml logs redis kafka
    exit 1
fi

# Start backend
print_status "Starting backend service..."
docker-compose -f docker-compose.dev.yml up -d backend-dev

# Wait for backend to be ready
print_status "Waiting for backend to be ready..."
sleep 15

# Check if backend is running
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up.*backend-dev"; then
    print_success "Backend service is running"
else
    print_error "Failed to start backend service"
    print_status "Checking backend logs..."
    docker-compose -f docker-compose.dev.yml logs backend-dev
    exit 1
fi

# Test backend health
print_status "Testing backend health..."
sleep 5
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed, but continuing..."
fi

# Start frontend
print_status "Starting frontend service..."
docker-compose -f docker-compose.dev.yml up -d frontend-dev

# Wait for frontend to be ready
print_status "Waiting for frontend to be ready..."
sleep 15

# Check if frontend is running
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up.*frontend-dev"; then
    print_success "Frontend service is running"
else
    print_error "Failed to start frontend service"
    print_status "Checking frontend logs..."
    docker-compose -f docker-compose.dev.yml logs frontend-dev
    exit 1
fi

# Test frontend accessibility
print_status "Testing frontend accessibility..."
sleep 5
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend is accessible"
else
    print_warning "Frontend accessibility test failed, but continuing..."
fi

echo ""
print_success "🎉 Development environment started successfully!"
echo ""
echo "📊 Access Points:"
echo "  - Frontend Dashboard: http://localhost:3000"
echo "  - Backend API: http://localhost:3001"
echo "  - WebSocket: ws://localhost:3001"
echo "  - Health Check: http://localhost:3001/health"
echo ""
echo "📋 Services Status:"
docker-compose -f docker-compose.dev.yml ps
echo ""
echo "📝 Useful Commands:"
echo "  - View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "  - Stop services: docker-compose -f docker-compose.dev.yml down"
echo "  - Restart services: docker-compose -f docker-compose.dev.yml restart"
echo ""
echo "🎮 Ready for development with hot reloading!"
echo ""
print_status "Opening browser..."
if command -v open > /dev/null 2>&1; then
    open http://localhost:3000
elif command -v xdg-open > /dev/null 2>&1; then
    xdg-open http://localhost:3000
else
    print_status "Please open http://localhost:3000 in your browser"
fi