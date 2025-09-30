import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

// Import configurations
import { connectDB } from './config/database.js';
import { kafkaClient } from './config/kafka.js';
import { logger } from './config/logger.js';

// Import services
import { dataSimulator } from './services/DataSimulator.js';

// Import routes
import trainRoutes from './routes/trains.js';
import conflictRoutes from './routes/conflicts.js';
import optimizationRoutes from './routes/optimization.js';
import decisionRoutes from './routes/decisions.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.API_RATE_LIMIT || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/trains', trainRoutes);
app.use('/api/conflicts', conflictRoutes);
app.use('/api/optimization', optimizationRoutes);
app.use('/api/decisions', decisionRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  // Join room for real-time updates
  socket.join('rail-prism-updates');
  
  // Handle train position subscriptions
  socket.on('subscribe-train', (trainId) => {
    socket.join(`train-${trainId}`);
    logger.info(`Client ${socket.id} subscribed to train ${trainId}`);
  });
  
  // Handle conflict subscriptions
  socket.on('subscribe-conflicts', () => {
    socket.join('conflicts');
    logger.info(`Client ${socket.id} subscribed to conflicts`);
  });
  
  // Handle optimization subscriptions
  socket.on('subscribe-optimization', (conflictId) => {
    socket.join(`optimization-${conflictId}`);
    logger.info(`Client ${socket.id} subscribed to optimization for conflict ${conflictId}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Initialize services
async function initializeServices() {
  try {
    // Connect to database
    connectDB();
    logger.info('Database connected successfully');
    
    // Initialize Kafka
    await kafkaClient.initialize();
    logger.info('Kafka initialized successfully');
    
    // Initialize data simulator
    await dataSimulator.initialize();
    logger.info('Data simulator initialized successfully');
    
    // Set up Kafka consumers
    await setupKafkaConsumers();
    
    // Start data simulation
    await dataSimulator.startSimulation();
    logger.info('Data simulation started');
    
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Set up Kafka consumers for real-time updates
async function setupKafkaConsumers() {
  // Consumer for train positions
  await kafkaClient.subscribeToTopic(
    process.env.KAFKA_TRAIN_POSITIONS_TOPIC || 'train-positions',
    async (message, topic) => {
      // Broadcast to WebSocket clients
      io.to('rail-prism-updates').emit('train-position-update', message);
      io.to(`train-${message.trainId}`).emit('train-position-update', message);
    }
  );
  
  // Consumer for train events
  await kafkaClient.subscribeToTopic(
    process.env.KAFKA_TRAIN_EVENTS_TOPIC || 'train-events',
    async (message, topic) => {
      // Broadcast to WebSocket clients
      io.to('rail-prism-updates').emit('train-event', message);
      
      if (message.eventType === 'conflict_detected') {
        io.to('conflicts').emit('conflict-detected', message.conflict);
      }
    }
  );
  
  // Consumer for optimization results
  await kafkaClient.subscribeToTopic(
    process.env.KAFKA_OPTIMIZATION_RESULTS_TOPIC || 'optimization-results',
    async (message, topic) => {
      // Broadcast to WebSocket clients
      io.to(`optimization-${message.conflictId}`).emit('optimization-result', message);
    }
  );
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Stop data simulation
  dataSimulator.stopSimulation();
  
  // Disconnect Kafka
  await kafkaClient.disconnect();
  
  // Disconnect database
  await connectDB.disconnect();
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Stop data simulation
  dataSimulator.stopSimulation();
  
  // Disconnect Kafka
  await kafkaClient.disconnect();
  
  // Disconnect database
  await connectDB.disconnect();
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    server.listen(PORT, () => {
      logger.info(`🚆 RAIL-PRISM Backend Server running on port ${PORT}`);
      logger.info(`📡 WebSocket server running on port ${WS_PORT}`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();