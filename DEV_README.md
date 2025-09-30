# RAIL-PRISM Development Environment

This document describes how to set up and use the development environment for RAIL-PRISM.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Start the complete development environment
./start-dev.sh

# Or start with local MongoDB
./start-dev.sh --with-mongo
```

### Option 2: Manual Setup
```bash
# Start infrastructure services
docker-compose -f docker-compose.dev.yml up -d redis zookeeper kafka

# Start application services
docker-compose -f docker-compose.dev.yml up -d backend-dev frontend-dev
```

## 📁 Development Files

### Docker Compose Files
- `docker-compose.dev.yml` - Development environment with hot reloading
- `docker-compose.yml` - Production environment

### Dockerfiles
- `backend/Dockerfile.dev` - Backend development container
- `frontend/Dockerfile.dev` - Frontend development container
- `backend/Dockerfile` - Backend production container
- `Dockerfile.frontend` - Frontend production container

### Scripts
- `start-dev.sh` - Development environment startup script
- `start-mvp.sh` - Production environment startup script

## 🛠️ Development Features

### Hot Reloading
- **Frontend**: Vite dev server with instant hot reload
- **Backend**: Nodemon with automatic restart on file changes
- **Source Mounting**: Code changes reflect immediately in containers

### Debug Configuration
- **Log Level**: Set to `debug` for detailed logging
- **Rate Limiting**: Increased to 1000 requests for development
- **CORS**: Configured for localhost development

### Volume Mounting
- **Source Code**: Mounted for live editing
- **Node Modules**: Separate volume for faster rebuilds
- **Logs**: Persistent log storage

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React development server |
| Backend API | http://localhost:3001 | Express API server |
| WebSocket | ws://localhost:3002 | Socket.IO server |
| Health Check | http://localhost:3001/health | API health endpoint |
| Redis | localhost:6379 | Redis cache |
| Kafka | localhost:9092 | Kafka message broker |

## 📋 Service Management

### Start Services
```bash
# Full environment
./start-dev.sh

# Infrastructure only (Redis, Kafka)
./start-dev.sh --infra-only

# Applications only (Backend, Frontend)
./start-dev.sh --app-only

# With local MongoDB
./start-dev.sh --with-mongo
```

### Stop Services
```bash
# Stop all services
./start-dev.sh --stop

# Or manually
docker-compose -f docker-compose.dev.yml down
```

### View Logs
```bash
# All services
./start-dev.sh --logs

# Specific service
docker-compose -f docker-compose.dev.yml logs -f backend-dev
docker-compose -f docker-compose.dev.yml logs -f frontend-dev
```

### Check Status
```bash
# Service status
./start-dev.sh --status

# Or manually
docker-compose -f docker-compose.dev.yml ps
```

## 🔧 Development Workflow

### 1. Start Development Environment
```bash
./start-dev.sh
```

### 2. Make Code Changes
- Edit files in `frontend/src/` or `backend/src/`
- Changes are automatically reflected due to hot reloading
- No need to restart containers

### 3. View Changes
- Frontend: http://localhost:3000
- Backend: Check logs for API changes

### 4. Debug Issues
```bash
# View backend logs
docker-compose -f docker-compose.dev.yml logs -f backend-dev

# View frontend logs
docker-compose -f docker-compose.dev.yml logs -f frontend-dev

# View all logs
docker-compose -f docker-compose.dev.yml logs -f
```

## 🗄️ Database Options

### Option 1: MongoDB Atlas (Recommended)
- Uses cloud MongoDB database
- No local setup required
- Update `MONGODB_URI` in `backend/.env`

### Option 2: Local MongoDB
```bash
# Start with local MongoDB
./start-dev.sh --with-mongo

# Access MongoDB shell
docker exec -it rail-prism-mongodb-dev mongosh
```

## 🎮 Simulation Controls

The development environment includes the full simulation system:

### Time Controls
- **Play/Pause**: Control simulation flow
- **Speed**: 0.5x to 10x speed
- **Time Setting**: Jump to any time
- **Reset**: Start over from 06:00

### Demo Scenarios
- **Morning Rush**: 06:00, 2x speed
- **Afternoon Peak**: 14:30, 5x speed
- **Evening Rush**: 18:00, 3x speed
- **Night Service**: 22:00, 1x speed

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001

# Kill the process
kill -9 <PID>
```

#### Docker Issues
```bash
# Clean up Docker
docker system prune -a

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x start-dev.sh
```

#### MongoDB Connection Issues
- Check MongoDB Atlas connection string
- Ensure IP is whitelisted
- Verify database user permissions

### Reset Everything
```bash
# Stop all services
./start-dev.sh --stop

# Remove volumes
docker-compose -f docker-compose.dev.yml down -v

# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build
```

## 📊 Performance Tips

### Development Optimizations
- **Node Modules**: Cached in separate volumes
- **Hot Reloading**: Only rebuilds changed files
- **Debug Logging**: Can be disabled for better performance
- **Rate Limiting**: Increased for development

### Resource Usage
- **Memory**: ~2GB for full environment
- **CPU**: Moderate usage with hot reloading
- **Disk**: ~1GB for containers and volumes

## 🔄 Environment Variables

### Backend (.env)
```bash
NODE_ENV=development
PORT=3001
WS_PORT=3002
MONGODB_URI=mongodb+srv://...
REDIS_HOST=redis
REDIS_PORT=6379
KAFKA_BROKERS=kafka:29092
LOG_LEVEL=debug
JWT_SECRET=dev-super-secret-jwt-key
API_RATE_LIMIT=1000
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3002
VITE_NODE_ENV=development
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Development Server](https://vitejs.dev/guide/dev.html)
- [Nodemon Documentation](https://nodemon.io/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)

## 🤝 Contributing

1. Start development environment: `./start-dev.sh`
2. Make your changes
3. Test thoroughly
4. Commit your changes
5. Create pull request

For production deployment, use `./start-mvp.sh` instead.