import express from 'express';
import { dataSimulator } from '../services/DataSimulator.js';
import { logger } from '../config/logger.js';

const router = express.Router();

// Get simulation status
router.get('/status', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        isRunning: dataSimulator.isRunning,
        simulationTime: dataSimulator.getSimulationTime(),
        simulationSpeed: dataSimulator.simulationSpeed,
        trainsCount: dataSimulator.trains.length
      }
    });
  } catch (error) {
    logger.error('Error getting simulation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get simulation status'
    });
  }
});

// Start simulation
router.post('/start', async (req, res) => {
  try {
    await dataSimulator.startSimulation();
    res.json({
      success: true,
      message: 'Simulation started'
    });
  } catch (error) {
    logger.error('Error starting simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start simulation'
    });
  }
});

// Stop simulation
router.post('/stop', async (req, res) => {
  try {
    await dataSimulator.stopSimulation();
    res.json({
      success: true,
      message: 'Simulation stopped'
    });
  } catch (error) {
    logger.error('Error stopping simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop simulation'
    });
  }
});

// Set simulation time
router.post('/time', (req, res) => {
  try {
    const { time } = req.body;
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time format. Use HH:MM'
      });
    }

    dataSimulator.setSimulationTime(time);
    res.json({
      success: true,
      message: `Simulation time set to ${time}`,
      data: {
        simulationTime: dataSimulator.getSimulationTime()
      }
    });
  } catch (error) {
    logger.error('Error setting simulation time:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set simulation time'
    });
  }
});

// Set simulation speed
router.post('/speed', (req, res) => {
  try {
    const { speed } = req.body;
    if (typeof speed !== 'number' || speed < 0.1 || speed > 20) {
      return res.status(400).json({
        success: false,
        error: 'Invalid speed. Must be between 0.1 and 20'
      });
    }

    dataSimulator.setSimulationSpeed(speed);
    res.json({
      success: true,
      message: `Simulation speed set to ${speed}x`,
      data: {
        simulationSpeed: dataSimulator.simulationSpeed
      }
    });
  } catch (error) {
    logger.error('Error setting simulation speed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set simulation speed'
    });
  }
});

// Reset simulation
router.post('/reset', async (req, res) => {
  try {
    await dataSimulator.stopSimulation();
    dataSimulator.setSimulationTime('06:00');
    dataSimulator.setSimulationSpeed(1);
    
    res.json({
      success: true,
      message: 'Simulation reset to 06:00 at 1x speed'
    });
  } catch (error) {
    logger.error('Error resetting simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset simulation'
    });
  }
});

export default router;