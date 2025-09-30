import mongoose from 'mongoose';

const trainPositionSchema = new mongoose.Schema({
  trainId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  position: {
    stationId: String,
    blockId: String,
    distance: Number, // Distance from start in km
    latitude: Number,
    longitude: Number
  },
  speed: {
    type: Number,
    required: true
  },
  direction: {
    type: String,
    enum: ['up', 'down'],
    required: true
  },
  status: {
    type: String,
    enum: ['running', 'stopped', 'delayed', 'breakdown'],
    default: 'running'
  },
  nextStation: {
    stationId: String,
    stationName: String,
    estimatedArrival: Date
  },
  delay: {
    type: Number,
    default: 0
  },
  metadata: {
    signalAspect: String,
    trackCondition: String,
    weatherCondition: String,
    temperature: Number
  }
}, {
  timestamps: false // We use custom timestamp field
});

// Compound index for time-series queries
trainPositionSchema.index({ trainId: 1, timestamp: -1 });
trainPositionSchema.index({ timestamp: -1 });
trainPositionSchema.index({ 'position.blockId': 1, timestamp: -1 });

// TTL index to automatically delete old position data (keep 7 days)
trainPositionSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

export const TrainPosition = mongoose.model('TrainPosition', trainPositionSchema);