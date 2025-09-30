#!/bin/bash

# Quick Development Start Script
# This script helps you start the development environment step by step

echo "🚀 RAIL-PRISM Development Quick Start"
echo "===================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

echo "✅ docker-compose is available"
echo ""

# Setup environment files
echo "📝 Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "✅ Created backend/.env from example"
    else
        echo "⚠️  backend/.env.example not found, creating basic .env"
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
    echo "⚠️  backend/.env already exists"
fi

if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << EOF
# Development Configuration
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3002
VITE_NODE_ENV=development
EOF
    echo "✅ Created frontend/.env"
else
    echo "⚠️  frontend/.env already exists"
fi

echo ""

# Start infrastructure services
echo "🔧 Starting infrastructure services (Redis, Kafka)..."
docker-compose -f docker-compose.dev.yml up -d redis zookeeper kafka

echo "⏳ Waiting for services to be ready..."
sleep 15

# Check if services are running
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "✅ Infrastructure services are running"
else
    echo "❌ Failed to start infrastructure services"
    echo "📋 Service status:"
    docker-compose -f docker-compose.dev.yml ps
    echo ""
    echo "📋 Service logs:"
    docker-compose -f docker-compose.dev.yml logs
    exit 1
fi

echo ""

# Start application services
echo "🚀 Starting application services (Backend, Frontend)..."
docker-compose -f docker-compose.dev.yml up -d backend-dev frontend-dev

echo "⏳ Waiting for applications to start..."
sleep 10

# Check if applications are running
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "✅ Application services are running"
else
    echo "❌ Failed to start application services"
    echo "📋 Service status:"
    docker-compose -f docker-compose.dev.yml ps
    echo ""
    echo "📋 Service logs:"
    docker-compose -f docker-compose.dev.yml logs
    exit 1
fi

echo ""
echo "🎉 Development environment started successfully!"
echo ""
echo "📊 Access Points:"
echo "  - Frontend Dashboard: http://localhost:3000"
echo "  - Backend API: http://localhost:3001"
echo "  - WebSocket: ws://localhost:3002"
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