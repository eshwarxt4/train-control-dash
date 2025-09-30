#!/bin/bash

# RAIL-PRISM MVP Startup Script
# This script sets up and starts the complete MVP system

set -e

echo "🚆 RAIL-PRISM MVP Startup Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    print_status "Checking Docker status..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed. Please install docker-compose and try again."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env file"
    else
        print_warning "backend/.env already exists"
    fi
    
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env << EOF
# Frontend Environment Variables
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3002
EOF
        print_success "Created frontend .env file"
    else
        print_warning "frontend/.env already exists"
    fi
}

# Start infrastructure services
start_infrastructure() {
    print_status "Starting infrastructure services (Redis, Kafka)..."
    
    # Start core services
    docker-compose up -d redis zookeeper kafka
    
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Infrastructure services are running"
    else
        print_error "Failed to start infrastructure services"
        docker-compose logs
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing root dependencies..."
    npm install
    
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    print_success "Dependencies installed"
}

# Start backend server
start_backend() {
    print_status "Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    print_status "Waiting for backend to start..."
    sleep 10
    
    # Check if backend is running
    if curl -s http://localhost:3001/health > /dev/null; then
        print_success "Backend server is running on http://localhost:3001"
    else
        print_error "Backend server failed to start"
        exit 1
    fi
}

# Start frontend server
start_frontend() {
    print_status "Starting frontend server..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to start
    print_status "Waiting for frontend to start..."
    sleep 15
    
    # Check if frontend is running
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Frontend server is running on http://localhost:3000"
    else
        print_error "Frontend server failed to start"
        exit 1
    fi
}

# Seed database with sample data
seed_database() {
    print_status "Seeding database with sample data..."
    cd backend
    npm run seed
    cd ..
    print_success "Database seeded with sample data"
}

# Start data simulation
start_simulation() {
    print_status "Starting data simulation..."
    cd backend
    npm run simulate &
    SIMULATION_PID=$!
    cd ..
    print_success "Data simulation started"
}

# Display system status
show_status() {
    echo ""
    echo "🎉 RAIL-PRISM MVP is now running!"
    echo "=================================="
    echo ""
    echo "📊 Frontend Dashboard: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:3001"
    echo "📡 WebSocket: ws://localhost:3002"
    echo "🏥 Health Check: http://localhost:3001/health"
    echo ""
    echo "📋 Services Status:"
    echo "  - MongoDB: External cloud database"
    echo "  - Redis: Running on port 6379"
    echo "  - Kafka: Running on port 9092"
    echo "  - Backend API: Running on port 3001"
    echo "  - Frontend: Running on port 3000"
    echo ""
    echo "🎮 Demo Scenarios:"
    echo "  1. Normal Operations - Smooth train operations"
    echo "  2. Planned Maintenance - Conflict resolution"
    echo "  3. Emergency Breakdown - Emergency response"
    echo ""
    echo "📚 Documentation: MVP_README.md"
    echo ""
    echo "Press Ctrl+C to stop all services"
}

# Cleanup function
cleanup() {
    echo ""
    print_status "Stopping services..."
    
    # Kill background processes
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$SIMULATION_PID" ]; then
        kill $SIMULATION_PID 2>/dev/null || true
    fi
    
    # Stop Docker services
    docker-compose down
    
    print_success "All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    echo "Starting RAIL-PRISM MVP setup..."
    echo ""
    
    check_docker
    check_dependencies
    setup_environment
    start_infrastructure
    install_dependencies
    start_backend
    seed_database
    start_simulation
    start_frontend
    show_status
    
    # Keep script running
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"