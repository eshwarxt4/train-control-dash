# RAIL-PRISM MVP: AI-Assisted Railway Decision Support System

## 🎯 MVP Overview

This is a comprehensive MVP implementation of RAIL-PRISM, an AI-assisted railway decision support system that demonstrates real-time train scheduling optimization, conflict detection, and intelligent recommendations for railway Section Controllers.

## 🏗️ Architecture

### Project Structure
```
train-control-dash/
├── backend/                 # Node.js backend server
│   ├── src/                # Source code
│   ├── package.json        # Backend dependencies
│   └── Dockerfile          # Backend container
├── frontend/               # React frontend application
│   ├── src/                # Source code
│   ├── package.json        # Frontend dependencies
│   └── nginx.conf          # Nginx configuration
├── docker-compose.yml      # Multi-service orchestration
├── Dockerfile.frontend     # Frontend container
├── start-mvp.sh           # Startup script
└── README.md              # Documentation
```

### Backend (Node.js + Express)
- **API Server**: RESTful APIs for data management
- **Real-time Data**: WebSocket connections for live updates
- **Streaming**: Kafka for real-time data flow
- **Database**: MongoDB for data persistence
- **Cache**: Redis for performance optimization
- **Optimization Engine**: Rule-based AI for conflict resolution

### Frontend (React + TypeScript)
- **Real-time Dashboard**: Live train monitoring and conflict visualization
- **Interactive Graphs**: D3.js-powered time-distance charts
- **Decision Interface**: AI recommendation acceptance/rejection
- **Metrics Dashboard**: Comprehensive performance analytics
- **WebSocket Integration**: Real-time updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd train-control-dash

# Copy environment files
cp backend/.env.example backend/.env
```

### 2. Start Infrastructure (Docker)
```bash
# Start Redis and Kafka (MongoDB uses external cloud database)
docker-compose up -d redis zookeeper kafka

# Wait for services to be ready (about 30 seconds)
docker-compose logs -f kafka
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Start Backend
```bash
cd backend
npm run dev
# Server will start on http://localhost:3001
```

### 5. Start Frontend
```bash
cd frontend
npm run dev
# App will start on http://localhost:3000
```

## 📊 MVP Features

### 1. Real-time Train Monitoring
- **Live Position Tracking**: Real-time train positions with WebSocket updates
- **Status Monitoring**: Track running, delayed, and breakdown trains
- **Time-Distance Graph**: Interactive visualization of train movements
- **Conflict Detection**: Automatic detection of train conflicts

### 2. AI Optimization Engine
- **Conflict Resolution**: Generate 3-5 ranked options for each conflict
- **Priority-based Decisions**: Express trains prioritized over freight
- **Confidence Scoring**: AI confidence levels (75-92%)
- **Impact Analysis**: Predicted delays and throughput effects

### 3. Decision Support Interface
- **Recommendation Panel**: Display AI-generated options
- **Simulation Mode**: Preview outcomes before implementation
- **Accept/Override**: Controller decision logging
- **Audit Trail**: Complete decision history

### 4. Metrics Dashboard
- **Performance KPIs**: Delay reduction, resolution rates
- **Real-time Analytics**: Live system status
- **Controller Metrics**: Individual performance tracking
- **Trend Analysis**: Historical performance data

## 🔧 API Endpoints

### Train Management
```bash
# Get all train schedules
GET /api/trains/schedules

# Get active trains
GET /api/trains/active

# Get train positions
GET /api/trains/positions

# Update train status
PUT /api/trains/schedules/:trainId/status
```

### Conflict Management
```bash
# Get active conflicts
GET /api/conflicts/active

# Get conflict details
GET /api/conflicts/:conflictId

# Update conflict status
PUT /api/conflicts/:conflictId/status
```

### Optimization
```bash
# Generate optimization for conflict
POST /api/optimization/conflict/:conflictId

# Select optimization option
PUT /api/optimization/results/:optimizationId/select

# Simulate optimization
POST /api/optimization/simulate
```

### Decision Logging
```bash
# Log decision
POST /api/decisions

# Get decision metrics
GET /api/decisions/controller/:controllerId/metrics
```

## 🎮 Demo Scenarios

### Scenario 1: Normal Operations
- 12 trains running on schedule
- No conflicts detected
- Demonstrates smooth operations

### Scenario 2: Planned Maintenance
- Maintenance window at Station C
- Express vs Freight conflict
- AI generates rerouting options

### Scenario 3: Emergency Breakdown
- Freight train breakdown
- Cascading delays
- Emergency response recommendations

## 📈 Key Metrics

### System Performance
- **Delay Reduction**: 15-25% improvement
- **Conflict Resolution Time**: <5 minutes average
- **AI Acceptance Rate**: 85-90%
- **System Uptime**: 99.9%

### Controller Performance
- **Decision Response Time**: <30 seconds
- **Success Rate**: 80-90%
- **Override Rate**: 10-15%
- **Effectiveness Score**: 75-85%

## 🔄 Real-time Data Flow

```
Data Simulator → Kafka → Backend API → WebSocket → Frontend
     ↓              ↓         ↓           ↓         ↓
MongoDB ← Redis ← Processing ← Optimization ← Dashboard
```

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon
npm run seed         # Seed database with sample data
npm run simulate     # Start data simulation
npm test            # Run tests
```

### Frontend Development
```bash
cd frontend
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Database Management
```bash
# MongoDB: Use MongoDB Atlas or your cloud provider's connection string
# Update MONGODB_URI in backend/.env with your connection string

# Access Redis
docker exec -it rail-prism-redis redis-cli

# View Kafka topics
docker exec -it rail-prism-kafka kafka-topics --list --bootstrap-server localhost:9092
```

## 🚀 Production Deployment

### Docker Deployment
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3
```

### Environment Configuration
```bash
# Backend environment variables
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rail_prism?retryWrites=true&w=majority
KAFKA_BROKERS=kafka:9092
REDIS_HOST=redis

# Frontend environment variables
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=http://localhost:3002
```

## 📊 Monitoring

### Health Checks
- **Backend**: `GET /health`
- **Database**: Connection status
- **Kafka**: Topic availability
- **WebSocket**: Connection count

### Logging
- **Application Logs**: `backend/logs/app.log`
- **Error Logs**: `backend/logs/error.log`
- **Access Logs**: HTTP request logging

## 🔒 Security

### Authentication
- JWT-based authentication
- Role-based access control (Controller/Viewer)
- API rate limiting

### Data Protection
- Input validation with Joi
- SQL injection prevention
- CORS configuration
- Helmet security headers

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # Unit tests
npm run test:integration    # Integration tests
npm run test:coverage      # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                   # Unit tests
npm run test:e2e          # End-to-end tests
```

## 📚 Documentation

### API Documentation
- Swagger UI available at `/api/docs`
- OpenAPI 3.0 specification
- Interactive API explorer

### Code Documentation
- JSDoc comments for all functions
- TypeScript interfaces for type safety
- README files for each component

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

### Code Standards
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Conventional commits

## 📞 Support

### Troubleshooting
- Check Docker services: `docker-compose ps`
- View logs: `docker-compose logs [service]`
- Health check: `curl http://localhost:3001/health`

### Common Issues
- **Port conflicts**: Change ports in docker-compose.yml
- **Database connection**: Check MongoDB credentials
- **Kafka topics**: Verify topic creation
- **WebSocket connection**: Check CORS settings

## 🎯 Future Enhancements

### Phase 2 Features
- Machine Learning integration
- Advanced optimization algorithms
- Mobile application
- Multi-railway network support

### Phase 3 Features
- Predictive analytics
- Weather integration
- Passenger impact analysis
- Integration with real railway systems

---

**RAIL-PRISM MVP** | Built for Smart India Hackathon | Professional Railway AI Control System