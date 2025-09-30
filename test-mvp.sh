#!/bin/bash

# RAIL-PRISM MVP Test Script
# This script tests the MVP functionality end-to-end

echo "🧪 RAIL-PRISM MVP Testing Suite"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Testing: ${test_name}${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: ${test_name}${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED: ${test_name}${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

# Function to check if a service is running
check_service() {
    local service_name="$1"
    local port="$2"
    
    if curl -s "http://localhost:${port}/health" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check if a URL is accessible
check_url() {
    local url="$1"
    
    if curl -s "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

echo "🔍 Pre-flight Checks"
echo "==================="

# Check if Docker is running
run_test "Docker is running" "docker info > /dev/null 2>&1"

# Check if docker-compose is available
run_test "Docker Compose is available" "command -v docker-compose > /dev/null 2>&1"

# Check if development environment files exist
run_test "Development environment files exist" "[ -f 'docker-compose.dev.yml' ] && [ -f 'start-dev.sh' ]"

# Check if backend environment file exists
run_test "Backend environment file exists" "[ -f 'backend/.env' ]"

# Check if frontend environment file exists
run_test "Frontend environment file exists" "[ -f 'frontend/.env' ]"

echo ""
echo "🚀 Starting Development Environment"
echo "=================================="

# Start the development environment
echo "Starting services..."
if ./start-dev.sh > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Development environment started${NC}"
else
    echo -e "${RED}❌ Failed to start development environment${NC}"
    exit 1
fi

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 30

echo ""
echo "🌐 Service Connectivity Tests"
echo "============================="

# Test backend health
run_test "Backend health check" "check_service 'backend' '3001'"

# Test frontend accessibility
run_test "Frontend accessibility" "check_url 'http://localhost:3000'"

# Test WebSocket endpoint (basic check)
run_test "WebSocket endpoint check" "curl -s 'http://localhost:3002' > /dev/null 2>&1"

echo ""
echo "🔧 API Endpoint Tests"
echo "===================="

# Test train schedules API
run_test "Train schedules API" "curl -s 'http://localhost:3001/api/trains/schedules' | grep -q 'success'"

# Test conflicts API
run_test "Conflicts API" "curl -s 'http://localhost:3001/api/conflicts' | grep -q 'success'"

# Test system status API
run_test "System status API" "curl -s 'http://localhost:3001/api/trains/status' | grep -q 'success'"

# Test simulation control API
run_test "Simulation control API" "curl -s 'http://localhost:3001/api/simulation/status' | grep -q 'success'"

echo ""
echo "🎨 Frontend Component Tests"
echo "=========================="

# Test if frontend builds without errors
run_test "Frontend TypeScript compilation" "cd frontend && npm run build > /dev/null 2>&1"

# Test if frontend dependencies are installed
run_test "Frontend dependencies installed" "cd frontend && [ -d 'node_modules' ]"

echo ""
echo "📊 Data Flow Tests"
echo "================="

# Test if backend can generate train data
run_test "Backend data generation" "curl -s 'http://localhost:3001/api/trains/schedules?limit=5' | grep -q 'trainId'"

# Test if conflicts can be detected
run_test "Conflict detection" "curl -s 'http://localhost:3001/api/conflicts/active' | grep -q 'conflictId'"

echo ""
echo "🔗 Integration Tests"
echo "=================="

# Test WebSocket connection (basic)
run_test "WebSocket connection" "timeout 5s curl -s 'http://localhost:3002/socket.io/' > /dev/null 2>&1"

# Test API response format
run_test "API response format" "curl -s 'http://localhost:3001/api/trains/schedules' | grep -q 'data'"

echo ""
echo "📋 Test Results Summary"
echo "======================"

echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! MVP is working correctly.${NC}"
    echo ""
    echo "🌐 Access Points:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:3001"
    echo "  - WebSocket: ws://localhost:3002"
    echo ""
    echo "📝 Next Steps:"
    echo "  1. Open http://localhost:3000 in your browser"
    echo "  2. Select a role (Controller or Viewer)"
    echo "  3. Explore the dashboard features"
    echo "  4. Test simulation controls"
    echo "  5. Monitor real-time data updates"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the errors above.${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "  1. Check if all services are running: docker-compose -f docker-compose.dev.yml ps"
    echo "  2. Check service logs: docker-compose -f docker-compose.dev.yml logs"
    echo "  3. Restart services: ./start-dev.sh"
    echo "  4. Check environment files: backend/.env and frontend/.env"
    exit 1
fi