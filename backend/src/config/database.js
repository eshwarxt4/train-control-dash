import mongoose from 'mongoose';
import { logger } from './logger.js';

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rail_prism';
      
      this.connection = await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info('Connected to MongoDB successfully');
      
      // Create indexes for better performance
      await this.createIndexes();
      
      return this.connection;
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      // Train positions index for time-series queries
      await mongoose.connection.db.collection('trainpositions').createIndex({
        trainId: 1,
        timestamp: -1
      });

      // Train schedules index
      await mongoose.connection.db.collection('trainschedules').createIndex({
        trainId: 1,
        departureTime: 1
      });

      // Conflicts index
      await mongoose.connection.db.collection('conflicts').createIndex({
        timestamp: -1,
        status: 1
      });

      // Optimization results index
      await mongoose.connection.db.collection('optimizationresults').createIndex({
        conflictId: 1,
        timestamp: -1
      });

      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Error creating indexes:', error);
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    }
  }

  getConnection() {
    return this.connection;
  }
}

export const database = new Database();