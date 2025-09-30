import express from 'express';
import { optimizationEngine } from '../services/OptimizationEngine.js';
import { OptimizationResult } from '../models/OptimizationResult.js';
import { Conflict } from '../models/Conflict.js';
import { logger } from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * POST /api/optimization/conflict/:conflictId
 * Generate optimization options for a conflict
 */
router.post('/conflict/:conflictId', async (req, res) => {
  try {
    const { conflictId } = req.params;
    
    // Check if conflict exists
    const conflict = await Conflict.findOne({ conflictId });
    if (!conflict) {
      return res.status(404).json({
        success: false,
        error: 'Conflict not found'
      });
    }
    
    // Check if optimization already exists
    const existingOptimization = await OptimizationResult.findOne({
      conflictId,
      status: { $in: ['generated', 'presented'] }
    });
    
    if (existingOptimization) {
      return res.json({
        success: true,
        data: existingOptimization,
        message: 'Optimization already exists'
      });
    }
    
    // Generate optimization
    const optimization = await optimizationEngine.optimizeConflict(conflictId);
    
    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    logger.error('Error generating optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate optimization'
    });
  }
});

/**
 * GET /api/optimization/results
 * Get optimization results
 */
router.get('/results', async (req, res) => {
  try {
    const { conflictId, status, limit = 50, hours = 24 } = req.query;
    
    const filter = {
      timestamp: {
        $gte: new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000)
      }
    };
    
    if (conflictId) filter.conflictId = conflictId;
    if (status) filter.status = status;
    
    const results = await OptimizationResult.find(filter)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });
    
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    logger.error('Error fetching optimization results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch optimization results'
    });
  }
});

/**
 * GET /api/optimization/results/:optimizationId
 * Get specific optimization result
 */
router.get('/results/:optimizationId', async (req, res) => {
  try {
    const { optimizationId } = req.params;
    
    const result = await OptimizationResult.findOne({ optimizationId });
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Optimization result not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching optimization result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch optimization result'
    });
  }
});

/**
 * PUT /api/optimization/results/:optimizationId/select
 * Select an optimization option
 */
router.put('/results/:optimizationId/select', async (req, res) => {
  try {
    const { optimizationId } = req.params;
    const { optionId, controllerId, reasoning } = req.body;
    
    const optimization = await OptimizationResult.findOne({ optimizationId });
    if (!optimization) {
      return res.status(404).json({
        success: false,
        error: 'Optimization result not found'
      });
    }
    
    // Validate option exists
    const selectedOption = optimization.options.find(opt => opt.optionId === optionId);
    if (!selectedOption) {
      return res.status(400).json({
        success: false,
        error: 'Selected option not found'
      });
    }
    
    // Update optimization result
    optimization.selectedOption = optionId;
    optimization.status = 'accepted';
    
    await optimization.save();
    
    // Update conflict status
    await Conflict.findOneAndUpdate(
      { conflictId: optimization.conflictId },
      {
        status: 'resolved',
        resolution: {
          selectedOption: optionId,
          appliedBy: controllerId,
          appliedAt: new Date(),
          reason: reasoning || 'AI recommendation accepted',
          effectiveness: 0 // Will be updated later based on actual outcome
        },
        resolvedAt: new Date()
      }
    );
    
    res.json({
      success: true,
      data: optimization,
      message: 'Option selected successfully'
    });
  } catch (error) {
    logger.error('Error selecting optimization option:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to select optimization option'
    });
  }
});

/**
 * POST /api/optimization/simulate
 * Simulate optimization option
 */
router.post('/simulate', async (req, res) => {
  try {
    const { conflictId, optionId, simulationTime = 30 } = req.body;
    
    // Get optimization result
    const optimization = await OptimizationResult.findOne({ conflictId });
    if (!optimization) {
      return res.status(404).json({
        success: false,
        error: 'Optimization result not found'
      });
    }
    
    // Find the option
    const option = optimization.options.find(opt => opt.optionId === optionId);
    if (!option) {
      return res.status(400).json({
        success: false,
        error: 'Option not found'
      });
    }
    
    // Simulate the option (simplified simulation)
    const simulationResult = await simulateOption(option, simulationTime);
    
    res.json({
      success: true,
      data: {
        option,
        simulation: simulationResult,
        simulationTime: `${simulationTime} minutes`
      }
    });
  } catch (error) {
    logger.error('Error simulating optimization option:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate optimization option'
    });
  }
});

/**
 * GET /api/optimization/metrics
 * Get optimization metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    // Get optimization results
    const results = await OptimizationResult.find({
      timestamp: { $gte: startDate }
    });
    
    // Calculate metrics
    const metrics = {
      totalOptimizations: results.length,
      acceptedOptimizations: results.filter(r => r.status === 'accepted').length,
      rejectedOptimizations: results.filter(r => r.status === 'rejected').length,
      averageProcessingTime: 0,
      averageConfidence: 0,
      averageEffectiveness: 0,
      byAlgorithm: {},
      byStatus: {}
    };
    
    if (results.length > 0) {
      // Calculate averages
      metrics.averageProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
      
      const allOptions = results.flatMap(r => r.options);
      if (allOptions.length > 0) {
        metrics.averageConfidence = allOptions.reduce((sum, opt) => sum + opt.confidence, 0) / allOptions.length;
      }
      
      const effectiveResults = results.filter(r => r.feedback && r.feedback.effectiveness);
      if (effectiveResults.length > 0) {
        metrics.averageEffectiveness = effectiveResults.reduce((sum, r) => sum + r.feedback.effectiveness, 0) / effectiveResults.length;
      }
      
      // Group by algorithm
      results.forEach(result => {
        metrics.byAlgorithm[result.algorithm] = (metrics.byAlgorithm[result.algorithm] || 0) + 1;
        metrics.byStatus[result.status] = (metrics.byStatus[result.status] || 0) + 1;
      });
    }
    
    res.json({
      success: true,
      data: {
        ...metrics,
        acceptanceRate: metrics.totalOptimizations > 0 ? 
          (metrics.acceptedOptimizations / metrics.totalOptimizations) * 100 : 0,
        period: `${days} days`,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching optimization metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch optimization metrics'
    });
  }
});

/**
 * POST /api/optimization/feedback
 * Provide feedback on optimization result
 */
router.post('/feedback', async (req, res) => {
  try {
    const { optimizationId, controllerRating, effectiveness, comments } = req.body;
    
    const optimization = await OptimizationResult.findOne({ optimizationId });
    if (!optimization) {
      return res.status(404).json({
        success: false,
        error: 'Optimization result not found'
      });
    }
    
    optimization.feedback = {
      controllerRating,
      effectiveness,
      comments,
      timestamp: new Date()
    };
    
    await optimization.save();
    
    res.json({
      success: true,
      data: optimization,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    logger.error('Error recording feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record feedback'
    });
  }
});

/**
 * Helper function to simulate an option
 */
async function simulateOption(option, simulationTime) {
  // Simplified simulation - in real implementation, this would use the digital twin
  const simulation = {
    optionId: option.optionId,
    action: option.action,
    simulationTime,
    predictedOutcomes: option.predictedOutcomes,
    timeline: [],
    finalMetrics: {
      totalDelay: option.predictedOutcomes.totalDelay,
      throughputImpact: option.predictedOutcomes.throughputImpact,
      passengerImpact: option.predictedOutcomes.passengerImpact,
      costImpact: option.predictedOutcomes.costImpact
    }
  };
  
  // Generate timeline events
  for (let i = 0; i < simulationTime; i += 5) {
    simulation.timeline.push({
      time: i,
      event: `${option.action} implemented`,
      impact: 'positive',
      description: `Option ${option.action} shows expected results`
    });
  }
  
  return simulation;
}

export default router;