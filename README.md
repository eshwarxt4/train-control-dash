# RAIL-PRISM: AI-Assisted Railway Decision Support System

![RAIL-PRISM Dashboard](https://img.shields.io/badge/RAIL--PRISM-AI%20Railway%20Control-blue)
![Status](https://img.shields.io/badge/Status-MVP%20Ready-green)
![Tech](https://img.shields.io/badge/Tech-React%20%7C%20Node.js%20%7C%20MongoDB%20%7C%20Kafka-blue)

A comprehensive MVP implementation of RAIL-PRISM — an AI-assisted decision support system for railway Section Controllers. This system provides real-time train monitoring, intelligent conflict detection, and AI-powered recommendations for optimal railway operations.

## 🏗️ Project Structure

```
train-control-dash/
├── backend/                 # Node.js backend server
│   ├── src/                # Source code
│   │   ├── config/         # Configuration files
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── server.js       # Main server file
│   ├── package.json        # Backend dependencies
│   ├── Dockerfile          # Backend container
│   └── .env.example        # Environment variables template
├── frontend/               # React frontend application
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API and WebSocket services
│   │   ├── types/          # TypeScript type definitions
│   │   └── main.tsx        # Application entry point
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.ts      # Vite configuration
│   ├── tailwind.config.ts  # Tailwind CSS configuration
│   └── nginx.conf          # Nginx configuration for Docker
├── docker-compose.yml      # Multi-service orchestration
├── Dockerfile.frontend     # Frontend container
├── start-mvp.sh           # Automated startup script
├── MVP_README.md         # Detailed MVP documentation
├── MVP_SUMMARY.md        # Implementation summary
└── README.md             # This file
```

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Make the startup script executable
chmod +x start-mvp.sh

# Start the complete MVP system
./start-mvp.sh
```

### Option 2: Manual Setup
```bash
# 1. Start infrastructure services (MongoDB uses external cloud database)
docker-compose up -d redis zookeeper kafka

# 2. Install and start backend
cd backend
npm install
npm run dev

# 3. Install and start frontend (in new terminal)
cd frontend
npm install
npm run dev
```

## 🌐 Access Points

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:3002
- **Health Check**: http://localhost:3001/health

## 🎮 Demo Scenarios

1. **Normal Operations**: Smooth train operations with no conflicts
2. **Planned Maintenance**: Conflict resolution with AI recommendations
3. **Emergency Breakdown**: Emergency response with cascading effects

## 🏗️ Architecture Overview

### Backend Services
- **Express.js API**: RESTful endpoints for all operations
- **WebSocket Server**: Real-time communication
- **Kafka Streaming**: High-performance data pipeline
- **MongoDB**: Document-based data storage
- **Redis**: Caching and session management
- **AI Optimization Engine**: Conflict resolution algorithms

### Frontend Features
- **Real-time Dashboard**: Live train monitoring
- **Interactive Graphs**: D3.js visualizations
- **Decision Interface**: AI recommendation handling
- **Metrics Dashboard**: Performance analytics
- **Responsive Design**: Professional control room UI

## 📊 Key Features

- ✅ **Real-time Train Monitoring**: Live position tracking
- ✅ **AI Conflict Detection**: Automatic conflict identification
- ✅ **Intelligent Recommendations**: 3-5 ranked options per conflict
- ✅ **Decision Support**: Accept/Override functionality
- ✅ **Comprehensive Metrics**: Performance tracking and analytics
- ✅ **Professional UI**: Control room-grade interface
- ✅ **Scalable Architecture**: Production-ready design

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev          # Start with hot reload
npm run seed         # Seed database
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

## 📚 Documentation

- **[MVP_README.md](./MVP_README.md)**: Comprehensive setup and usage guide
- **[MVP_SUMMARY.md](./MVP_SUMMARY.md)**: Implementation summary and features
- **API Documentation**: Available at `/api/docs` when backend is running

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🎯 MVP Success Metrics

- **Delay Reduction**: 15-25% improvement
- **Conflict Resolution**: <5 minutes average
- **AI Acceptance Rate**: 85-90%
- **Decision Response Time**: <30 seconds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is built for the Smart India Hackathon (SIH) and is available under the MIT License.

---

**RAIL-PRISM MVP** | Built with ❤️ for Smart India Hackathon | Professional Railway AI Control System