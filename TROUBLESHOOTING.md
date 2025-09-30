# RAIL-PRISM Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. WebSocket Connection Failed

**Error**: `WebSocket connection to 'ws://localhost:3002/socket.io/?EIO=4&transport=websocket' failed`

**Cause**: Backend server is not running on port 3002

**Solutions**:

#### Option A: Start Development Environment
```bash
# Use the quick start script
./quick-start-dev.sh

# Or use the full development script
./start-dev.sh
```

#### Option B: Check if Backend is Running
```bash
# Check if backend container is running
docker-compose -f docker-compose.dev.yml ps

# Check backend logs
docker-compose -f docker-compose.dev.yml logs backend-dev

# Restart backend if needed
docker-compose -f docker-compose.dev.yml restart backend-dev
```

#### Option C: Manual Backend Start
```bash
# Start infrastructure first
docker-compose -f docker-compose.dev.yml up -d redis zookeeper kafka

# Start backend
docker-compose -f docker-compose.dev.yml up -d backend-dev
```

### 2. Dashboard Error: "state is not defined"

**Error**: `Uncaught ReferenceError: state is not defined at Dashboard (Dashboard.tsx:163:24)`

**Cause**: Dashboard component still references old `state` object instead of destructured variables

**Solution**: ✅ **FIXED** - Updated Dashboard component to use destructured variables

### 3. MongoDB Connection Issues

**Error**: `MongoDB connection error: querySrv ECONNREFUSED`

**Solutions**:

#### Option A: Use MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string
4. Update `backend/.env`:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rail_prism?retryWrites=true&w=majority
   ```

#### Option B: Use Local MongoDB
```bash
# Start with local MongoDB
./start-dev.sh --with-mongo

# Or manually
docker-compose -f docker-compose.dev.yml --profile mongodb up -d mongodb-dev
```

### 4. Port Already in Use

**Error**: `Port 3000/3001/3002 is already in use`

**Solutions**:
```bash
# Find what's using the port
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Kill the process
kill -9 <PID>

# Or stop all containers
docker-compose -f docker-compose.dev.yml down
```

### 5. Docker Issues

**Error**: `Cannot connect to the Docker daemon`

**Solutions**:
```bash
# Start Docker Desktop
# On macOS: Open Docker Desktop application
# On Linux: sudo systemctl start docker

# Check Docker status
docker info

# Clean up Docker
docker system prune -a
```

### 6. Frontend Not Loading

**Error**: Frontend shows blank page or errors

**Solutions**:
```bash
# Check frontend logs
docker-compose -f docker-compose.dev.yml logs frontend-dev

# Restart frontend
docker-compose -f docker-compose.dev.yml restart frontend-dev

# Rebuild frontend
docker-compose -f docker-compose.dev.yml up --build frontend-dev
```

### 7. Backend API Not Responding

**Error**: API calls return 404 or connection refused

**Solutions**:
```bash
# Check backend logs
docker-compose -f docker-compose.dev.yml logs backend-dev

# Check if backend is running
curl http://localhost:3001/health

# Restart backend
docker-compose -f docker-compose.dev.yml restart backend-dev
```

## 🔧 Development Environment Setup

### Quick Start (Recommended)
```bash
# Start everything with one command
./quick-start-dev.sh
```

### Manual Setup
```bash
# 1. Start infrastructure
docker-compose -f docker-compose.dev.yml up -d redis zookeeper kafka

# 2. Wait for services
sleep 15

# 3. Start applications
docker-compose -f docker-compose.dev.yml up -d backend-dev frontend-dev

# 4. Check status
docker-compose -f docker-compose.dev.yml ps
```

### Environment Files
Make sure these files exist:

**backend/.env**:
```bash
NODE_ENV=development
PORT=3001
WS_PORT=3002
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rail_prism?retryWrites=true&w=majority
REDIS_HOST=redis
REDIS_PORT=6379
KAFKA_BROKERS=kafka:29092
LOG_LEVEL=debug
```

**frontend/.env**:
```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3002
VITE_NODE_ENV=development
```

## 📊 Service Status Check

### Check All Services
```bash
docker-compose -f docker-compose.dev.yml ps
```

### Check Specific Service Logs
```bash
# Backend logs
docker-compose -f docker-compose.dev.yml logs -f backend-dev

# Frontend logs
docker-compose -f docker-compose.dev.yml logs -f frontend-dev

# All logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Test Endpoints
```bash
# Health check
curl http://localhost:3001/health

# API test
curl http://localhost:3001/api/trains/schedules

# Frontend
curl http://localhost:3000
```

## 🚀 Reset Everything

If nothing works, reset everything:

```bash
# Stop all services
docker-compose -f docker-compose.dev.yml down

# Remove volumes (WARNING: This will delete data)
docker-compose -f docker-compose.dev.yml down -v

# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build
```

## 📞 Getting Help

1. **Check logs first**: `docker-compose -f docker-compose.dev.yml logs -f`
2. **Check service status**: `docker-compose -f docker-compose.dev.yml ps`
3. **Try quick start**: `./quick-start-dev.sh`
4. **Reset if needed**: Follow reset instructions above

## 🎯 Expected Behavior

When everything is working correctly:

- ✅ Frontend loads at http://localhost:3000
- ✅ Backend API responds at http://localhost:3001/health
- ✅ WebSocket connects to ws://localhost:3002
- ✅ No console errors in browser
- ✅ Simulation controls work
- ✅ Train data loads and displays