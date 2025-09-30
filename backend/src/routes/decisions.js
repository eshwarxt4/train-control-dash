import express from 'express';
import { DecisionLog } from '../models/DecisionLog.js';
import { logger } from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

const router = express.Router();

/**
 * POST /api/decisions
 * Log a decision
 */
router.post('/', async (req, res) => {
  try {
    const {
      conflictId,
      optimizationId,
      controllerId,
      controllerRole,
      decision,
      selectedOption,
      reasoning,
      responseTime
    } = req.body;
    
    const decisionLog = new DecisionLog({
      decisionId: `decision_${Date.now()}_${uuidv4().substring(0, 8)}`,
      conflictId,
      optimizationId,
      controllerId,
      controllerRole,
      decision,
      selectedOption,
      reasoning,
      responseTime,
      timestamp: new Date(),
      context: {
        timeOfDay: moment().format('HH:mm'),
        dayOfWeek: moment().format('dddd'),
        weatherCondition: 'normal', // Would be fetched from weather service
        systemLoad: 0.7, // Would be calculated from current system state
        previousDecisions: [] // Would be fetched from recent decisions
      }
    });
    
    await decisionLog.save();
    
    res.json({
      success: true,
      data: decisionLog,
      message: 'Decision logged successfully'
    });
  } catch (error) {
    logger.error('Error logging decision:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log decision'
    });
  }
});

/**
 * GET /api/decisions
 * Get decision logs
 */
router.get('/', async (req, res) => {
  try {
    const {
      controllerId,
      decision,
      conflictId,
      limit = 50,
      hours = 24
    } = req.query;
    
    const filter = {
      timestamp: {
        $gte: moment().subtract(parseInt(hours), 'hours').toDate()
      }
    };
    
    if (controllerId) filter.controllerId = controllerId;
    if (decision) filter.decision = decision;
    if (conflictId) filter.conflictId = conflictId;
    
    const decisions = await DecisionLog.find(filter)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });
    
    res.json({
      success: true,
      data: decisions,
      count: decisions.length
    });
  } catch (error) {
    logger.error('Error fetching decisions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch decisions'
    });
  }
});

/**
 * GET /api/decisions/:decisionId
 * Get specific decision
 */
router.get('/:decisionId', async (req, res) => {
  try {
    const { decisionId } = req.params;
    
    const decision = await DecisionLog.findOne({ decisionId });
    if (!decision) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }
    
    res.json({
      success: true,
      data: decision
    });
  } catch (error) {
    logger.error('Error fetching decision:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch decision'
    });
  }
});

/**
 * PUT /api/decisions/:decisionId/outcome
 * Update decision outcome
 */
router.put('/:decisionId/outcome', async (req, res) => {
  try {
    const { decisionId } = req.params;
    const {
      actualDelay,
      actualThroughputImpact,
      passengerFeedback,
      effectiveness
    } = req.body;
    
    const decision = await DecisionLog.findOneAndUpdate(
      { decisionId },
      {
        outcome: {
          actualDelay,
          actualThroughputImpact,
          passengerFeedback,
          effectiveness,
          measuredAt: new Date()
        }
      },
      { new: true }
    );
    
    if (!decision) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }
    
    res.json({
      success: true,
      data: decision,
      message: 'Outcome updated successfully'
    });
  } catch (error) {
    logger.error('Error updating decision outcome:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update decision outcome'
    });
  }
});

/**
 * GET /api/decisions/controller/:controllerId/metrics
 * Get controller performance metrics
 */
router.get('/controller/:controllerId/metrics', async (req, res) => {
  try {
    const { controllerId } = req.params;
    const { days = 30 } = req.query;
    
    const metrics = await DecisionLog.getControllerMetrics(controllerId, parseInt(days));
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error fetching controller metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch controller metrics'
    });
  }
});

/**
 * GET /api/decisions/stats
 * Get overall decision statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = moment().subtract(parseInt(days), 'days').toDate();
    
    const decisions = await DecisionLog.find({
      timestamp: { $gte: startDate }
    });
    
    const stats = {
      total: decisions.length,
      byDecision: {},
      byController: {},
      averageResponseTime: 0,
      successRate: 0,
      averageEffectiveness: 0
    };
    
    if (decisions.length > 0) {
      // Group by decision type
      decisions.forEach(decision => {
        stats.byDecision[decision.decision] = (stats.byDecision[decision.decision] || 0) + 1;
        stats.byController[decision.controllerId] = (stats.byController[decision.controllerId] || 0) + 1;
      });
      
      // Calculate averages
      stats.averageResponseTime = decisions.reduce((sum, d) => sum + d.responseTime, 0) / decisions.length;
      
      const successfulDecisions = decisions.filter(d => d.wasSuccessful()).length;
      stats.successRate = (successfulDecisions / decisions.length) * 100;
      
      const decisionsWithOutcome = decisions.filter(d => d.outcome && d.outcome.effectiveness);
      if (decisionsWithOutcome.length > 0) {
        stats.averageEffectiveness = decisionsWithOutcome.reduce((sum, d) => 
          sum + d.outcome.effectiveness, 0) / decisionsWithOutcome.length;
      }
    }
    
    res.json({
      success: true,
      data: {
        ...stats,
        period: `${days} days`,
        lastUpdated: moment().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching decision statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch decision statistics'
    });
  }
});

/**
 * GET /api/decisions/analytics/trends
 * Get decision trends over time
 */
router.get('/analytics/trends', async (req, res) => {
  try {
    const { days = 7, interval = 'hour' } = req.query;
    const startDate = moment().subtract(parseInt(days), 'days');
    
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startDate.toDate() }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: interval === 'hour' ? '%Y-%m-%d %H:00' : '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          totalDecisions: { $sum: 1 },
          acceptedDecisions: {
            $sum: { $cond: [{ $eq: ['$decision', 'accepted'] }, 1, 0] }
          },
          rejectedDecisions: {
            $sum: { $cond: [{ $eq: ['$decision', 'rejected'] }, 1, 0] }
          },
          averageResponseTime: { $avg: '$responseTime' },
          averageEffectiveness: {
            $avg: {
              $cond: [
                { $ne: ['$outcome.effectiveness', null] },
                '$outcome.effectiveness',
                null
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];
    
    const trends = await DecisionLog.aggregate(pipeline);
    
    res.json({
      success: true,
      data: trends,
      period: `${days} days`,
      interval
    });
  } catch (error) {
    logger.error('Error fetching decision trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch decision trends'
    });
  }
});

/**
 * GET /api/decisions/analytics/performance
 * Get performance analytics
 */
router.get('/analytics/performance', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = moment().subtract(parseInt(days), 'days').toDate();
    
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startDate },
          outcome: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$controllerId',
          totalDecisions: { $sum: 1 },
          successfulDecisions: {
            $sum: { $cond: [{ $gt: ['$outcome.effectiveness', 70] }, 1, 0] }
          },
          averageResponseTime: { $avg: '$responseTime' },
          averageEffectiveness: { $avg: '$outcome.effectiveness' },
          decisions: {
            $push: {
              decision: '$decision',
              effectiveness: '$outcome.effectiveness',
              responseTime: '$responseTime',
              timestamp: '$timestamp'
            }
          }
        }
      },
      {
        $project: {
          controllerId: '$_id',
          totalDecisions: 1,
          successRate: {
            $multiply: [
              { $divide: ['$successfulDecisions', '$totalDecisions'] },
              100
            ]
          },
          averageResponseTime: { $round: ['$averageResponseTime', 2] },
          averageEffectiveness: { $round: ['$averageEffectiveness', 2] },
          decisions: 1
        }
      },
      {
        $sort: { averageEffectiveness: -1 }
      }
    ];
    
    const performance = await DecisionLog.aggregate(pipeline);
    
    res.json({
      success: true,
      data: performance,
      period: `${days} days`
    });
  } catch (error) {
    logger.error('Error fetching performance analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance analytics'
    });
  }
});

export default router;