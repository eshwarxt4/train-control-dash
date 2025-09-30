import mongoose from 'mongoose';

const conflictSchema = new mongoose.Schema({
  conflictId: {
    type: String,
    required: true,
    unique: true
  },
  conflictType: {
    type: String,
    enum: ['headway', 'platform', 'block', 'signal', 'maintenance'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  trains: [{
    trainId: String,
    trainType: String,
    priority: Number,
    currentPosition: {
      stationId: String,
      distance: Number,
      blockId: String
    },
    estimatedArrival: Date
  }],
  location: {
    stationId: String,
    stationName: String,
    blockId: String,
    blockName: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  conflictTime: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['detected', 'analyzing', 'resolved', 'escalated'],
    default: 'detected'
  },
  impact: {
    affectedTrains: [String],
    estimatedDelay: Number,
    throughputImpact: Number,
    passengerImpact: Number
  },
  resolution: {
    selectedOption: String,
    appliedBy: String,
    appliedAt: Date,
    reason: String,
    effectiveness: Number // 0-100%
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient querying
conflictSchema.index({ status: 1, severity: -1 });
conflictSchema.index({ conflictTime: -1 });
conflictSchema.index({ 'trains.trainId': 1 });
conflictSchema.index({ 'location.stationId': 1 });

// Method to calculate conflict urgency
conflictSchema.methods.getUrgency = function() {
  const now = new Date();
  const timeToConflict = this.conflictTime.getTime() - now.getTime();
  const minutesToConflict = timeToConflict / (1000 * 60);
  
  if (minutesToConflict < 5) return 'critical';
  if (minutesToConflict < 15) return 'high';
  if (minutesToConflict < 30) return 'medium';
  return 'low';
};

// Method to check if conflict is resolved
conflictSchema.methods.isResolved = function() {
  return this.status === 'resolved' && this.resolvedAt;
};

// Method to get affected train types
conflictSchema.methods.getAffectedTrainTypes = function() {
  return [...new Set(this.trains.map(train => train.trainType))];
};

export const Conflict = mongoose.model('Conflict', conflictSchema);