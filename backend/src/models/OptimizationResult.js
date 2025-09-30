import mongoose from 'mongoose';

const optimizationOptionSchema = new mongoose.Schema({
  optionId: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['hold', 'reroute', 'speed_adjust', 'platform_change', 'delay'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  affectedTrains: [{
    trainId: String,
    action: String,
    delayMinutes: Number,
    newRoute: [String],
    newSpeed: Number
  }],
  predictedOutcomes: {
    totalDelay: Number,
    throughputImpact: Number,
    passengerImpact: Number,
    costImpact: Number
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  feasibility: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  implementationTime: {
    type: Number, // minutes
    required: true
  },
  riskFactors: [{
    factor: String,
    probability: Number,
    impact: String
  }]
});

const optimizationResultSchema = new mongoose.Schema({
  optimizationId: {
    type: String,
    required: true,
    unique: true
  },
  conflictId: {
    type: String,
    required: true,
    ref: 'Conflict'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  algorithm: {
    type: String,
    enum: ['cp-sat', 'genetic', 'simulated_annealing', 'rule_based'],
    required: true
  },
  processingTime: {
    type: Number, // milliseconds
    required: true
  },
  options: [optimizationOptionSchema],
  selectedOption: {
    type: String,
    ref: 'optimizationOptionSchema.optionId'
  },
  status: {
    type: String,
    enum: ['generated', 'presented', 'accepted', 'rejected', 'implemented'],
    default: 'generated'
  },
  metrics: {
    totalConflictsResolved: Number,
    averageDelayReduction: Number,
    systemEfficiency: Number,
    passengerSatisfaction: Number
  },
  feedback: {
    controllerRating: Number,
    effectiveness: Number,
    comments: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
optimizationResultSchema.index({ conflictId: 1, timestamp: -1 });
optimizationResultSchema.index({ status: 1, timestamp: -1 });
optimizationResultSchema.index({ algorithm: 1 });

// Method to get best option by confidence
optimizationResultSchema.methods.getBestOption = function() {
  return this.options.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );
};

// Method to get options sorted by effectiveness
optimizationResultSchema.methods.getSortedOptions = function() {
  return this.options.sort((a, b) => {
    // Sort by confidence * feasibility
    const scoreA = a.confidence * a.feasibility;
    const scoreB = b.confidence * b.feasibility;
    return scoreB - scoreA;
  });
};

// Method to calculate overall effectiveness
optimizationResultSchema.methods.getOverallEffectiveness = function() {
  if (!this.feedback) return null;
  return (this.feedback.controllerRating + this.feedback.effectiveness) / 2;
};

export const OptimizationResult = mongoose.model('OptimizationResult', optimizationResultSchema);