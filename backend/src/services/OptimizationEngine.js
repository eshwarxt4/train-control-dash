import { logger } from '../config/logger.js';
import { Conflict } from '../models/Conflict.js';
import { TrainSchedule } from '../models/TrainSchedule.js';
import { OptimizationResult } from '../models/OptimizationResult.js';

class OptimizationEngine {
  constructor() {
    this.maxProcessingTime = parseInt(process.env.OPTIMIZATION_TIMEOUT_MS) || 5000;
  }

  /**
   * Main optimization method that generates conflict resolution options
   * @param {string} conflictId - The conflict to resolve
   * @returns {Object} Optimization result with ranked options
   */
  async optimizeConflict(conflictId) {
    const startTime = Date.now();
    
    try {
      // Fetch conflict and related data
      const conflict = await Conflict.findById(conflictId);
      if (!conflict) {
        throw new Error(`Conflict ${conflictId} not found`);
      }

      // Get train schedules for all affected trains
      const trainIds = conflict.trains.map(t => t.trainId);
      const trains = await TrainSchedule.find({ trainId: { $in: trainIds } });

      // Generate optimization options
      const options = await this.generateOptimizationOptions(conflict, trains);
      
      // Rank options by effectiveness
      const rankedOptions = this.rankOptions(options, conflict);
      
      const processingTime = Date.now() - startTime;
      
      // Create optimization result
      const optimizationResult = new OptimizationResult({
        optimizationId: `opt_${Date.now()}_${conflictId}`,
        conflictId,
        algorithm: 'cp-sat',
        processingTime,
        options: rankedOptions,
        status: 'generated',
        metrics: this.calculateMetrics(rankedOptions, conflict)
      });

      await optimizationResult.save();
      
      logger.info(`Optimization completed for conflict ${conflictId} in ${processingTime}ms`);
      
      return optimizationResult;
      
    } catch (error) {
      logger.error(`Optimization failed for conflict ${conflictId}:`, error);
      throw error;
    }
  }

  /**
   * Generate multiple optimization options for a conflict
   */
  async generateOptimizationOptions(conflict, trains) {
    const options = [];

    // Option 1: Priority-based holding strategy
    options.push(await this.generateHoldOption(conflict, trains));
    
    // Option 2: Rerouting strategy
    options.push(await this.generateRerouteOption(conflict, trains));
    
    // Option 3: Speed adjustment strategy
    options.push(await this.generateSpeedAdjustmentOption(conflict, trains));
    
    // Option 4: Platform change strategy (if applicable)
    if (conflict.conflictType === 'platform') {
      options.push(await this.generatePlatformChangeOption(conflict, trains));
    }
    
    // Option 5: Delay distribution strategy
    options.push(await this.generateDelayDistributionOption(conflict, trains));

    return options.filter(option => option !== null);
  }

  /**
   * Generate hold option - hold lower priority train
   */
  async generateHoldOption(conflict, trains) {
    const lowerPriorityTrain = trains.reduce((min, train) => 
      train.priority < min.priority ? train : min
    );

    const holdDuration = this.calculateOptimalHoldDuration(conflict, trains);
    
    return {
      optionId: `hold_${lowerPriorityTrain.trainId}_${Date.now()}`,
      action: 'hold',
      description: `Hold ${lowerPriorityTrain.trainId} (${lowerPriorityTrain.trainType}) for ${holdDuration} minutes`,
      affectedTrains: [{
        trainId: lowerPriorityTrain.trainId,
        action: 'hold',
        delayMinutes: holdDuration,
        newRoute: null,
        newSpeed: null
      }],
      predictedOutcomes: {
        totalDelay: holdDuration,
        throughputImpact: -1,
        passengerImpact: this.calculatePassengerImpact(lowerPriorityTrain, holdDuration),
        costImpact: holdDuration * 1000 // Rs 1000 per minute delay
      },
      confidence: this.calculateHoldConfidence(conflict, lowerPriorityTrain),
      feasibility: 0.95, // High feasibility for hold operations
      implementationTime: 2, // 2 minutes to implement
      riskFactors: [
        {
          factor: 'Cascading delays',
          probability: 0.3,
          impact: 'medium'
        }
      ]
    };
  }

  /**
   * Generate reroute option - use alternate tracks
   */
  async generateRerouteOption(conflict, trains) {
    const expressTrain = trains.find(t => t.trainType === 'Express' || t.trainType === 'Rajdhani');
    if (!expressTrain) return null;

    const alternateRoute = this.findAlternateRoute(conflict, expressTrain);
    if (!alternateRoute) return null;

    const additionalDistance = alternateRoute.additionalDistance;
    const additionalTime = (additionalDistance / expressTrain.averageSpeed) * 60;

    return {
      optionId: `reroute_${expressTrain.trainId}_${Date.now()}`,
      action: 'reroute',
      description: `Reroute ${expressTrain.trainId} via ${alternateRoute.route.join(' → ')}`,
      affectedTrains: [{
        trainId: expressTrain.trainId,
        action: 'reroute',
        delayMinutes: additionalTime,
        newRoute: alternateRoute.route,
        newSpeed: expressTrain.averageSpeed
      }],
      predictedOutcomes: {
        totalDelay: additionalTime,
        throughputImpact: 0,
        passengerImpact: this.calculatePassengerImpact(expressTrain, additionalTime),
        costImpact: additionalTime * 1500 // Higher cost for express trains
      },
      confidence: this.calculateRerouteConfidence(conflict, alternateRoute),
      feasibility: alternateRoute.feasibility,
      implementationTime: 5,
      riskFactors: [
        {
          factor: 'Track availability',
          probability: 0.2,
          impact: 'high'
        },
        {
          factor: 'Signal coordination',
          probability: 0.4,
          impact: 'medium'
        }
      ]
    };
  }

  /**
   * Generate speed adjustment option
   */
  async generateSpeedAdjustmentOption(conflict, trains) {
    const fasterTrain = trains.reduce((max, train) => 
      train.averageSpeed > max.averageSpeed ? train : max
    );

    const speedReduction = Math.min(20, fasterTrain.averageSpeed * 0.15); // Max 20 km/h or 15% reduction
    const newSpeed = fasterTrain.averageSpeed - speedReduction;
    
    // Calculate delay based on remaining journey
    const remainingDistance = this.calculateRemainingDistance(fasterTrain, conflict);
    const originalTime = (remainingDistance / fasterTrain.averageSpeed) * 60;
    const newTime = (remainingDistance / newSpeed) * 60;
    const delay = newTime - originalTime;

    return {
      optionId: `speed_${fasterTrain.trainId}_${Date.now()}`,
      action: 'speed_adjust',
      description: `Reduce ${fasterTrain.trainId} speed by ${speedReduction} km/h to ${newSpeed} km/h`,
      affectedTrains: [{
        trainId: fasterTrain.trainId,
        action: 'speed_adjust',
        delayMinutes: delay,
        newRoute: null,
        newSpeed: newSpeed
      }],
      predictedOutcomes: {
        totalDelay: delay,
        throughputImpact: -0.5,
        passengerImpact: this.calculatePassengerImpact(fasterTrain, delay),
        costImpact: delay * 800
      },
      confidence: this.calculateSpeedAdjustmentConfidence(fasterTrain, speedReduction),
      feasibility: 0.9,
      implementationTime: 3,
      riskFactors: [
        {
          factor: 'Schedule disruption',
          probability: 0.4,
          impact: 'medium'
        }
      ]
    };
  }

  /**
   * Generate platform change option
   */
  async generatePlatformChangeOption(conflict, trains) {
    const affectedTrain = trains[0]; // Usually one train needs platform change
    
    return {
      optionId: `platform_${affectedTrain.trainId}_${Date.now()}`,
      action: 'platform_change',
      description: `Change platform for ${affectedTrain.trainId} at ${conflict.location.stationName}`,
      affectedTrains: [{
        trainId: affectedTrain.trainId,
        action: 'platform_change',
        delayMinutes: 5,
        newRoute: null,
        newSpeed: null
      }],
      predictedOutcomes: {
        totalDelay: 5,
        throughputImpact: 0,
        passengerImpact: this.calculatePassengerImpact(affectedTrain, 5),
        costImpact: 500
      },
      confidence: 0.85,
      feasibility: 0.8,
      implementationTime: 2,
      riskFactors: [
        {
          factor: 'Platform availability',
          probability: 0.3,
          impact: 'high'
        }
      ]
    };
  }

  /**
   * Generate delay distribution option
   */
  async generateDelayDistributionOption(conflict, trains) {
    const totalRequiredDelay = this.calculateRequiredDelay(conflict);
    const distributedDelay = totalRequiredDelay / trains.length;

    return {
      optionId: `distribute_${Date.now()}`,
      action: 'delay',
      description: `Distribute ${totalRequiredDelay} minutes delay across all affected trains`,
      affectedTrains: trains.map(train => ({
        trainId: train.trainId,
        action: 'delay',
        delayMinutes: Math.round(distributedDelay),
        newRoute: null,
        newSpeed: null
      })),
      predictedOutcomes: {
        totalDelay: totalRequiredDelay,
        throughputImpact: -0.5,
        passengerImpact: trains.reduce((sum, train) => 
          sum + this.calculatePassengerImpact(train, distributedDelay), 0),
        costImpact: totalRequiredDelay * 600
      },
      confidence: 0.7,
      feasibility: 0.95,
      implementationTime: 1,
      riskFactors: [
        {
          factor: 'Multiple train coordination',
          probability: 0.5,
          impact: 'medium'
        }
      ]
    };
  }

  /**
   * Rank options by effectiveness
   */
  rankOptions(options, conflict) {
    return options.map(option => {
      // Calculate effectiveness score
      const effectivenessScore = this.calculateEffectivenessScore(option, conflict);
      
      return {
        ...option,
        effectivenessScore
      };
    }).sort((a, b) => b.effectivenessScore - a.effectivenessScore);
  }

  /**
   * Calculate effectiveness score for an option
   */
  calculateEffectivenessScore(option, conflict) {
    const confidenceWeight = 0.4;
    const feasibilityWeight = 0.3;
    const delayWeight = 0.2;
    const costWeight = 0.1;

    const confidenceScore = option.confidence;
    const feasibilityScore = option.feasibility;
    const delayScore = Math.max(0, 1 - (option.predictedOutcomes.totalDelay / 60)); // Normalize to 0-1
    const costScore = Math.max(0, 1 - (option.predictedOutcomes.costImpact / 10000)); // Normalize to 0-1

    return (
      confidenceScore * confidenceWeight +
      feasibilityScore * feasibilityWeight +
      delayScore * delayWeight +
      costScore * costWeight
    );
  }

  /**
   * Calculate metrics for the optimization result
   */
  calculateMetrics(options, conflict) {
    const bestOption = options[0];
    
    return {
      totalConflictsResolved: 1,
      averageDelayReduction: bestOption ? bestOption.predictedOutcomes.totalDelay : 0,
      systemEfficiency: bestOption ? bestOption.effectivenessScore * 100 : 0,
      passengerSatisfaction: bestOption ? 
        Math.max(0, 100 - bestOption.predictedOutcomes.passengerImpact) : 0
    };
  }

  // Helper methods
  calculateOptimalHoldDuration(conflict, trains) {
    const timeToConflict = (conflict.conflictTime.getTime() - Date.now()) / (1000 * 60);
    return Math.min(Math.max(timeToConflict + 5, 5), 30); // 5-30 minutes
  }

  calculatePassengerImpact(train, delayMinutes) {
    const baseImpact = delayMinutes * 10; // Base impact
    const typeMultiplier = train.trainType === 'Express' ? 1.5 : 1;
    return Math.round(baseImpact * typeMultiplier);
  }

  calculateHoldConfidence(conflict, train) {
    let confidence = 0.8; // Base confidence
    
    // Higher confidence for lower priority trains
    if (train.priority <= 3) confidence += 0.1;
    
    // Lower confidence for critical conflicts
    if (conflict.severity === 'critical') confidence -= 0.1;
    
    return Math.max(0.5, Math.min(1.0, confidence));
  }

  findAlternateRoute(conflict, train) {
    // Simplified alternate route finding
    const stationId = conflict.location.stationId;
    
    // Mock alternate routes based on station
    const alternateRoutes = {
      'B': { route: ['A', 'B-loop', 'C', 'D'], additionalDistance: 5, feasibility: 0.8 },
      'C': { route: ['A', 'B', 'C-loop', 'D'], additionalDistance: 8, feasibility: 0.7 }
    };
    
    return alternateRoutes[stationId] || null;
  }

  calculateRerouteConfidence(conflict, alternateRoute) {
    return alternateRoute.feasibility * 0.9; // Slightly lower than feasibility
  }

  calculateSpeedAdjustmentConfidence(train, speedReduction) {
    let confidence = 0.75;
    
    // Higher confidence for smaller speed reductions
    if (speedReduction <= 10) confidence += 0.1;
    
    // Lower confidence for freight trains
    if (train.trainType === 'Freight') confidence -= 0.05;
    
    return Math.max(0.6, Math.min(1.0, confidence));
  }

  calculateRemainingDistance(train, conflict) {
    // Simplified calculation - in real implementation, use actual route data
    return 50; // Assume 50km remaining
  }

  calculateRequiredDelay(conflict) {
    const timeToConflict = (conflict.conflictTime.getTime() - Date.now()) / (1000 * 60);
    return Math.max(5, timeToConflict + 5);
  }
}

export const optimizationEngine = new OptimizationEngine();