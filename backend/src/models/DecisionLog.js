import mongoose from 'mongoose';

const decisionLogSchema = new mongoose.Schema({
  decisionId: {
    type: String,
    required: true,
    unique: true
  },
  conflictId: {
    type: String,
    required: true,
    ref: 'Conflict'
  },
  optimizationId: {
    type: String,
    required: true,
    ref: 'OptimizationResult'
  },
  controllerId: {
    type: String,
    required: true
  },
  controllerRole: {
    type: String,
    enum: ['Controller', 'Viewer'],
    required: true
  },
  decision: {
    type: String,
    enum: ['accepted', 'rejected', 'modified', 'override'],
    required: true
  },
  selectedOption: {
    optionId: String,
    action: String,
    description: String,
    modifications: [{
      field: String,
      originalValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      reason: String
    }]
  },
  reasoning: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  responseTime: {
    type: Number, // milliseconds from optimization to decision
    required: true
  },
  outcome: {
    actualDelay: Number,
    actualThroughputImpact: Number,
    passengerFeedback: Number,
    effectiveness: Number,
    measuredAt: Date
  },
  context: {
    timeOfDay: String,
    dayOfWeek: String,
    weatherCondition: String,
    systemLoad: Number,
    previousDecisions: [String]
  }
}, {
  timestamps: true
});

// Indexes for analytics
decisionLogSchema.index({ controllerId: 1, timestamp: -1 });
decisionLogSchema.index({ decision: 1, timestamp: -1 });
decisionLogSchema.index({ 'outcome.effectiveness': -1 });
decisionLogSchema.index({ responseTime: 1 });

// Method to calculate decision quality
decisionLogSchema.methods.getDecisionQuality = function() {
  if (!this.outcome) return null;
  
  const effectiveness = this.outcome.effectiveness || 0;
  const responseTime = this.responseTime;
  
  // Quality score based on effectiveness and response time
  let qualityScore = effectiveness;
  
  // Penalize very slow decisions (>5 minutes)
  if (responseTime > 300000) {
    qualityScore *= 0.8;
  }
  
  return Math.round(qualityScore);
};

// Method to check if decision was successful
decisionLogSchema.methods.wasSuccessful = function() {
  return this.outcome && this.outcome.effectiveness > 70;
};

// Static method to get controller performance metrics
decisionLogSchema.statics.getControllerMetrics = async function(controllerId, timeRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);
  
  const decisions = await this.find({
    controllerId,
    timestamp: { $gte: startDate }
  });
  
  const totalDecisions = decisions.length;
  const successfulDecisions = decisions.filter(d => d.wasSuccessful()).length;
  const averageResponseTime = decisions.reduce((sum, d) => sum + d.responseTime, 0) / totalDecisions;
  const averageEffectiveness = decisions.reduce((sum, d) => 
    sum + (d.outcome?.effectiveness || 0), 0) / totalDecisions;
  
  return {
    totalDecisions,
    successRate: totalDecisions > 0 ? (successfulDecisions / totalDecisions) * 100 : 0,
    averageResponseTime,
    averageEffectiveness,
    timeRange
  };
};

export const DecisionLog = mongoose.model('DecisionLog', decisionLogSchema);