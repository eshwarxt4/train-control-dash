#!/bin/bash

# RAIL-PRISM Development Environment Startup Script
# This script starts the development environment with hot reloading

set -e

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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed. Please install docker-compose and try again."
        exit 1
    fi
}

# Function to setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            print_success "Created backend/.env from example"
        else
            print_warning "backend/.env.example not found, creating basic .env"
            cat > backend/.env << EOF
# Development Configuration
NODE_ENV=development
PORT=3001
WS_PORT=3002
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
        fi
    else
        print_warning "backend/.env already exists"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env << EOF
# Development Configuration
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3002
VITE_NODE_ENV=development
EOF
        print_success "Created frontend/.env"
    else
        print_warning "frontend/.env already exists"
    fi
}

# Function to start development services
start_dev_services() {
    print_status "Starting development services..."
    
    # Start infrastructure services (Redis, Kafka)
    docker-compose -f docker-compose.dev.yml up -d redis zookeeper kafka
    
    print_status "Waiting for services to be ready..."
    sleep 15
    
    # Check if services are running
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        print_success "Infrastructure services are running"
    else
        print_error "Failed to start infrastructure services"
        docker-compose -f docker-compose.dev.yml logs
        exit 1
    fi
}

# Function to start application services
start_app_services() {
    print_status "Starting application services..."
    
    # Start backend and frontend
    docker-compose -f docker-compose.dev.yml up -d backend-dev frontend-dev
    
    print_status "Waiting for applications to start..."
    sleep 10
    
    # Check if applications are running
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        print_success "Application services are running"
    else
        print_error "Failed to start application services"
        docker-compose -f docker-compose.dev.yml logs
        exit 1
    fi
}

# Function to show status
show_status() {
    echo ""
    print_success "🚀 RAIL-PRISM Development Environment Started!"
    echo ""
    echo "📊 Access Points:"
    echo "  - Frontend Dashboard: http://localhost:3000"
    echo "  - Backend API: http://localhost:3001"
    echo "  - WebSocket: ws://localhost:3002"
    echo "  - Health Check: http://localhost:3001/health"
    echo ""
    echo "📋 Services Status:"
    echo "  - MongoDB: External cloud database"
    echo "  - Redis: Running on port 6379"
    echo "  - Kafka: Running on port 9092"
    echo "  - Backend Dev: Running on port 3001 (with hot reload)"
    echo "  - Frontend Dev: Running on port 3000 (with hot reload)"
    echo ""
    echo "🛠️ Development Features:"
    echo "  - Hot reloading enabled for both frontend and backend"
    echo "  - Debug logging enabled"
    echo "  - Source code mounted for live editing"
    echo "  - Development-optimized configurations"
    echo ""
    echo "📝 Useful Commands:"
    echo "  - View logs: docker-compose -f docker-compose.dev.yml logs -f"
    echo "  - Stop services: docker-compose -f docker-compose.dev.yml down"
    echo "  - Restart services: docker-compose -f docker-compose.dev.yml restart"
    echo "  - Rebuild: docker-compose -f docker-compose.dev.yml up --build"
    echo ""
    echo "🎮 Demo Scenarios:"
    echo "  1. Morning Rush - 06:00, 2x speed"
    echo "  2. Afternoon Peak - 14:30, 5x speed"
    echo "  3. Evening Rush - 18:00, 3x speed"
    echo "  4. Night Service - 22:00, 1x speed"
}

# Function to show help
show_help() {
    echo "RAIL-PRISM Development Environment Startup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --infra-only   Start only infrastructure services (Redis, Kafka)"
    echo "  --app-only     Start only application services (Backend, Frontend)"
    echo "  --with-mongo   Include local MongoDB service"
    echo "  --stop         Stop all development services"
    echo "  --logs         Show logs for all services"
    echo "  --status       Show status of all services"
    echo ""
    echo "Examples:"
    echo "  $0                    # Start full development environment"
    echo "  $0 --infra-only       # Start only Redis and Kafka"
    echo "  $0 --with-mongo       # Start with local MongoDB"
    echo "  $0 --stop             # Stop all services"
    echo "  $0 --logs             # View logs"
}

# Function to stop services
stop_services() {
    print_status "Stopping development services..."
    docker-compose -f docker-compose.dev.yml down
    print_success "All development services stopped"
}

# Function to show logs
show_logs() {
    docker-compose -f docker-compose.dev.yml logs -f
}

# Function to show service status
show_service_status() {
    docker-compose -f docker-compose.dev.yml ps
}

# Main execution
main() {
    # Parse command line arguments
    INFRA_ONLY=false
    APP_ONLY=false
    WITH_MONGO=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --infra-only)
                INFRA_ONLY=true
                shift
                ;;
            --app-only)
                APP_ONLY=true
                shift
                ;;
            --with-mongo)
                WITH_MONGO=true
                shift
                ;;
            --stop)
                stop_services
                exit 0
                ;;
            --logs)
                show_logs
                exit 0
                ;;
            --status)
                show_service_status
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Check prerequisites
    check_docker
    check_docker_compose
    
    # Setup environment
    setup_environment
    
    if [ "$INFRA_ONLY" = true ]; then
        start_dev_services
        print_success "Infrastructure services started. Use --app-only to start applications."
    elif [ "$APP_ONLY" = true ]; then
        start_app_services
        print_success "Application services started."
    else
        # Start all services
        start_dev_services
        
        if [ "$WITH_MONGO" = true ]; then
            print_status "Starting local MongoDB..."
            docker-compose -f docker-compose.dev.yml --profile mongodb up -d mongodb-dev
        fi
        
        start_app_services
        show_status
    fi
}

# Run main function
main "$@"