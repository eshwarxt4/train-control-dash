import express from 'express';
import { TrainSchedule } from '../models/TrainSchedule.js';
import { TrainPosition } from '../models/TrainPosition.js';
import { logger } from '../config/logger.js';
import moment from 'moment';

const router = express.Router();

/**
 * GET /api/trains/schedules
 * Get all train schedules
 */
router.get('/schedules', async (req, res) => {
  try {
    const { status, trainType, limit = 50 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (trainType) filter.trainType = trainType;
    
    const schedules = await TrainSchedule.find(filter)
      .limit(parseInt(limit))
      .sort({ priority: -1, 'route.0.departureTime': 1 });
    
    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error) {
    logger.error('Error fetching train schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch train schedules'
    });
  }
});

/**
 * GET /api/trains/schedules/:trainId
 * Get specific train schedule
 */
router.get('/schedules/:trainId', async (req, res) => {
  try {
    const { trainId } = req.params;
    
    const schedule = await TrainSchedule.findOne({ trainId });
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Train schedule not found'
      });
    }
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    logger.error('Error fetching train schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch train schedule'
    });
  }
});

/**
 * GET /api/trains/positions
 * Get current train positions
 */
router.get('/positions', async (req, res) => {
  try {
    const { trainId, limit = 100, minutes = 5 } = req.query;
    
    const filter = {
      timestamp: {
        $gte: moment().subtract(parseInt(minutes), 'minutes').toDate()
      }
    };
    
    if (trainId) filter.trainId = trainId;
    
    const positions = await TrainPosition.find(filter)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });
    
    res.json({
      success: true,
      data: positions,
      count: positions.length
    });
  } catch (error) {
    logger.error('Error fetching train positions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch train positions'
    });
  }
});

/**
 * GET /api/trains/positions/:trainId
 * Get position history for specific train
 */
router.get('/positions/:trainId', async (req, res) => {
  try {
    const { trainId } = req.params;
    const { limit = 50, hours = 1 } = req.query;
    
    const positions = await TrainPosition.find({
      trainId,
      timestamp: {
        $gte: moment().subtract(parseInt(hours), 'hours').toDate()
      }
    })
    .limit(parseInt(limit))
    .sort({ timestamp: -1 });
    
    res.json({
      success: true,
      data: positions,
      count: positions.length
    });
  } catch (error) {
    logger.error('Error fetching train position history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch train position history'
    });
  }
});

/**
 * GET /api/trains/active
 * Get currently active trains
 */
router.get('/active', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Get recent positions (last 2 minutes)
    const recentPositions = await TrainPosition.find({
      timestamp: {
        $gte: moment().subtract(2, 'minutes').toDate()
      }
    })
    .sort({ timestamp: -1 });
    
    // Group by trainId and get latest position for each train
    const activeTrains = {};
    recentPositions.forEach(position => {
      if (!activeTrains[position.trainId] || 
          position.timestamp > activeTrains[position.trainId].timestamp) {
        activeTrains[position.trainId] = position;
      }
    });
    
    const activeTrainList = Object.values(activeTrains)
      .slice(0, parseInt(limit))
      .map(position => ({
        trainId: position.trainId,
        position: position.position,
        speed: position.speed,
        status: position.status,
        delay: position.delay,
        timestamp: position.timestamp
      }));
    
    res.json({
      success: true,
      data: activeTrainList,
      count: activeTrainList.length
    });
  } catch (error) {
    logger.error('Error fetching active trains:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active trains'
    });
  }
});

/**
 * GET /api/trains/status
 * Get overall train status summary
 */
router.get('/status', async (req, res) => {
  try {
    const currentTime = moment();
    
    // Get train schedules
    const schedules = await TrainSchedule.find({});
    
    // Get recent positions
    const recentPositions = await TrainPosition.find({
      timestamp: {
        $gte: currentTime.clone().subtract(5, 'minutes').toDate()
      }
    });
    
    // Calculate statistics
    const stats = {
      total: schedules.length,
      scheduled: schedules.filter(s => s.status === 'scheduled').length,
      running: schedules.filter(s => s.status === 'running').length,
      delayed: schedules.filter(s => s.totalDelay > 0).length,
      breakdown: schedules.filter(s => s.status === 'breakdown').length,
      completed: schedules.filter(s => s.status === 'completed').length
    };
    
    // Calculate average delay
    const totalDelay = schedules.reduce((sum, s) => sum + s.totalDelay, 0);
    const averageDelay = schedules.length > 0 ? totalDelay / schedules.length : 0;
    
    // Get trains by type
    const trainsByType = schedules.reduce((acc, train) => {
      acc[train.trainType] = (acc[train.trainType] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        summary: stats,
        averageDelay: Math.round(averageDelay * 100) / 100,
        trainsByType,
        lastUpdated: currentTime.toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching train status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch train status'
    });
  }
});

/**
 * PUT /api/trains/schedules/:trainId/status
 * Update train status
 */
router.put('/schedules/:trainId/status', async (req, res) => {
  try {
    const { trainId } = req.params;
    const { status, delay, reason } = req.body;
    
    const updateData = { status };
    if (delay) {
      updateData.$inc = { totalDelay: delay };
      updateData.$push = {
        delays: {
          stationId: 'current',
          delayMinutes: delay,
          reason: reason || 'Manual update',
          timestamp: new Date()
        }
      };
    }
    
    const schedule = await TrainSchedule.findOneAndUpdate(
      { trainId },
      updateData,
      { new: true }
    );
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Train schedule not found'
      });
    }
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    logger.error('Error updating train status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update train status'
    });
  }
});

/**
 * GET /api/trains/delays
 * Get trains with delays
 */
router.get('/delays', async (req, res) => {
  try {
    const { minDelay = 5 } = req.query;
    
    const delayedTrains = await TrainSchedule.find({
      totalDelay: { $gte: parseInt(minDelay) }
    })
    .sort({ totalDelay: -1 });
    
    res.json({
      success: true,
      data: delayedTrains,
      count: delayedTrains.length
    });
  } catch (error) {
    logger.error('Error fetching delayed trains:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delayed trains'
    });
  }
});

export default router;