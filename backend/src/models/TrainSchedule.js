import mongoose from 'mongoose';

const trainScheduleSchema = new mongoose.Schema({
  trainId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  trainNumber: {
    type: String,
    required: true
  },
  trainType: {
    type: String,
    enum: ['Express', 'Local', 'Freight', 'Rajdhani', 'Shatabdi'],
    required: true
  },
  priority: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  route: [{
    stationId: String,
    stationName: String,
    arrivalTime: String,
    departureTime: String,
    distance: Number,
    platform: String
  }],
  totalDistance: {
    type: Number,
    required: true
  },
  averageSpeed: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'running', 'delayed', 'cancelled', 'completed'],
    default: 'scheduled'
  },
  currentPosition: {
    stationId: String,
    distance: Number,
    blockId: String
  },
  delays: [{
    stationId: String,
    delayMinutes: Number,
    reason: String,
    timestamp: Date
  }],
  totalDelay: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
trainScheduleSchema.index({ trainType: 1, priority: -1 });
trainScheduleSchema.index({ status: 1, departureTime: 1 });
trainScheduleSchema.index({ 'route.stationId': 1 });

// Virtual for next station
trainScheduleSchema.virtual('nextStation').get(function() {
  const currentPos = this.currentPosition;
  if (!currentPos) return null;
  
  const currentIndex = this.route.findIndex(station => 
    station.stationId === currentPos.stationId
  );
  
  return currentIndex < this.route.length - 1 ? this.route[currentIndex + 1] : null;
});

// Method to calculate estimated arrival at next station
trainScheduleSchema.methods.getEstimatedArrival = function() {
  const nextStation = this.nextStation;
  if (!nextStation) return null;
  
  const currentTime = new Date();
  const distanceToNext = nextStation.distance - this.currentPosition.distance;
  const timeToNext = (distanceToNext / this.averageSpeed) * 60; // minutes
  
  return new Date(currentTime.getTime() + timeToNext * 60000);
};

// Method to check if train is on time
trainScheduleSchema.methods.isOnTime = function() {
  return this.totalDelay <= 5; // Consider on time if delay <= 5 minutes
};

export const TrainSchedule = mongoose.model('TrainSchedule', trainScheduleSchema);