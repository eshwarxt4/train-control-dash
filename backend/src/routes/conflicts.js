import express from 'express';
import { Conflict } from '../models/Conflict.js';
import { logger } from '../config/logger.js';
import moment from 'moment';

const router = express.Router();

/**
 * GET /api/conflicts
 * Get all conflicts
 */
router.get('/', async (req, res) => {
  try {
    const { status, severity, limit = 50, hours = 24 } = req.query;
    
    const filter = {
      createdAt: {
        $gte: moment().subtract(parseInt(hours), 'hours').toDate()
      }
    };
    
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    
    const conflicts = await Conflict.find(filter)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: conflicts,
      count: conflicts.length
    });
  } catch (error) {
    logger.error('Error fetching conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conflicts'
    });
  }
});

/**
 * GET /api/conflicts/active
 * Get active conflicts
 */
router.get('/active', async (req, res) => {
  try {
    const activeConflicts = await Conflict.find({
      status: { $in: ['detected', 'analyzing'] }
    })
    .sort({ severity: -1, createdAt: -1 });
    
    res.json({
      success: true,
      data: activeConflicts,
      count: activeConflicts.length
    });
  } catch (error) {
    logger.error('Error fetching active conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active conflicts'
    });
  }
});

/**
 * GET /api/conflicts/:conflictId
 * Get specific conflict
 */
router.get('/:conflictId', async (req, res) => {
  try {
    const { conflictId } = req.params;
    
    const conflict = await Conflict.findOne({ conflictId });
    if (!conflict) {
      return res.status(404).json({
        success: false,
        error: 'Conflict not found'
      });
    }
    
    res.json({
      success: true,
      data: conflict
    });
  } catch (error) {
    logger.error('Error fetching conflict:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conflict'
    });
  }
});

/**
 * PUT /api/conflicts/:conflictId/status
 * Update conflict status
 */
router.put('/:conflictId/status', async (req, res) => {
  try {
    const { conflictId } = req.params;
    const { status, resolution } = req.body;
    
    const updateData = { status };
    if (resolution) {
      updateData.resolution = {
        ...resolution,
        appliedAt: new Date()
      };
    }
    
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }
    
    const conflict = await Conflict.findOneAndUpdate(
      { conflictId },
      updateData,
      { new: true }
    );
    
    if (!conflict) {
      return res.status(404).json({
        success: false,
        error: 'Conflict not found'
      });
    }
    
    res.json({
      success: true,
      data: conflict
    });
  } catch (error) {
    logger.error('Error updating conflict status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update conflict status'
    });
  }
});

/**
 * GET /api/conflicts/stats
 * Get conflict statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = moment().subtract(parseInt(days), 'days').toDate();
    
    // Get conflicts in date range
    const conflicts = await Conflict.find({
      createdAt: { $gte: startDate }
    });
    
    // Calculate statistics
    const stats = {
      total: conflicts.length,
      byStatus: {},
      bySeverity: {},
      byType: {},
      resolved: conflicts.filter(c => c.status === 'resolved').length,
      active: conflicts.filter(c => ['detected', 'analyzing'].includes(c.status)).length,
      averageResolutionTime: 0
    };
    
    // Group by status
    conflicts.forEach(conflict => {
      stats.byStatus[conflict.status] = (stats.byStatus[conflict.status] || 0) + 1;
      stats.bySeverity[conflict.severity] = (stats.bySeverity[conflict.severity] || 0) + 1;
      stats.byType[conflict.conflictType] = (stats.byType[conflict.conflictType] || 0) + 1;
    });
    
    // Calculate average resolution time
    const resolvedConflicts = conflicts.filter(c => c.resolvedAt);
    if (resolvedConflicts.length > 0) {
      const totalResolutionTime = resolvedConflicts.reduce((sum, conflict) => {
        return sum + (conflict.resolvedAt.getTime() - conflict.createdAt.getTime());
      }, 0);
      stats.averageResolutionTime = Math.round(totalResolutionTime / resolvedConflicts.length / 1000 / 60); // minutes
    }
    
    res.json({
      success: true,
      data: {
        ...stats,
        resolutionRate: stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0,
        period: `${days} days`,
        lastUpdated: moment().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching conflict statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conflict statistics'
    });
  }
});

/**
 * POST /api/conflicts/:conflictId/escalate
 * Escalate conflict
 */
router.post('/:conflictId/escalate', async (req, res) => {
  try {
    const { conflictId } = req.params;
    const { reason, escalatedBy } = req.body;
    
    const conflict = await Conflict.findOneAndUpdate(
      { conflictId },
      {
        status: 'escalated',
        $push: {
          escalationHistory: {
            reason,
            escalatedBy,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
    
    if (!conflict) {
      return res.status(404).json({
        success: false,
        error: 'Conflict not found'
      });
    }
    
    res.json({
      success: true,
      data: conflict
    });
  } catch (error) {
    logger.error('Error escalating conflict:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to escalate conflict'
    });
  }
});

/**
 * GET /api/conflicts/location/:stationId
 * Get conflicts at specific location
 */
router.get('/location/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { hours = 24 } = req.query;
    
    const conflicts = await Conflict.find({
      'location.stationId': stationId,
      createdAt: {
        $gte: moment().subtract(parseInt(hours), 'hours').toDate()
      }
    })
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: conflicts,
      count: conflicts.length
    });
  } catch (error) {
    logger.error('Error fetching conflicts by location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conflicts by location'
    });
  }
});

export default router;