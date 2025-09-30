import { logger } from '../config/logger.js';
import { kafkaClient } from '../config/kafka.js';
import { TrainSchedule } from '../models/TrainSchedule.js';
import { TrainPosition } from '../models/TrainPosition.js';
import { Conflict } from '../models/Conflict.js';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

class DataSimulator {
  constructor() {
    this.isRunning = false;
    this.simulationInterval = null;
    this.trains = [];
    this.stations = [
      { id: 'A', name: 'Station Alpha', position: 0, platforms: ['1', '2'] },
      { id: 'B', name: 'Station Beta', position: 25, platforms: ['1', '2', '3'] },
      { id: 'C', name: 'Station Charlie', position: 50, platforms: ['1', '2'] },
      { id: 'D', name: 'Station Delta', position: 75, platforms: ['1', '2', '3'] }
    ];
    this.blocks = [
      { id: 'A-B', from: 'A', to: 'B', length: 25, capacity: 1 },
      { id: 'B-C', from: 'B', to: 'C', length: 25, capacity: 1 },
      { id: 'C-D', from: 'C', to: 'D', length: 25, capacity: 1 },
      { id: 'B-loop', from: 'B', to: 'B', length: 30, capacity: 2 },
      { id: 'C-loop', from: 'C', to: 'C', length: 30, capacity: 2 }
    ];
  }

  /**
   * Initialize the simulator with train schedules
   */
  async initialize() {
    try {
      await this.generateTrainSchedules();
      await this.seedInitialData();
      logger.info('Data simulator initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize data simulator:', error);
      throw error;
    }
  }

  /**
   * Generate realistic train schedules for the day
   */
  async generateTrainSchedules() {
    const schedules = [];
    const currentDate = moment().format('YYYY-MM-DD');
    
    // Express trains (Rajdhani, Shatabdi)
    const expressTrains = [
      { id: 'E001', number: '12001', type: 'Rajdhani', priority: 10, speed: 120 },
      { id: 'E002', number: '12002', type: 'Rajdhani', priority: 10, speed: 115 },
      { id: 'E003', number: '12003', type: 'Shatabdi', priority: 9, speed: 110 },
      { id: 'E004', number: '12004', type: 'Express', priority: 8, speed: 100 }
    ];

    // Local trains
    const localTrains = [
      { id: 'L001', number: '12345', type: 'Local', priority: 6, speed: 60 },
      { id: 'L002', number: '12346', type: 'Local', priority: 6, speed: 65 },
      { id: 'L003', number: '12347', type: 'Local', priority: 5, speed: 60 },
      { id: 'L004', number: '12348', type: 'Local', priority: 5, speed: 55 }
    ];

    // Freight trains
    const freightTrains = [
      { id: 'F001', number: '12301', type: 'Freight', priority: 3, speed: 45 },
      { id: 'F002', number: '12302', type: 'Freight', priority: 3, speed: 40 },
      { id: 'F003', number: '12303', type: 'Freight', priority: 2, speed: 50 },
      { id: 'F004', number: '12304', type: 'Freight', priority: 2, speed: 45 }
    ];

    const allTrains = [...expressTrains, ...localTrains, ...freightTrains];

    // Generate schedules for each train
    for (const train of allTrains) {
      const schedule = this.generateSingleTrainSchedule(train);
      schedules.push(schedule);
    }

    // Save schedules to database
    await TrainSchedule.insertMany(schedules);
    this.trains = schedules;
    
    logger.info(`Generated ${schedules.length} train schedules`);
  }

  /**
   * Generate schedule for a single train
   */
  generateSingleTrainSchedule(train) {
    const departureHour = this.getDepartureHour(train.type);
    const departureMinute = Math.floor(Math.random() * 60);
    const departureTime = `${departureHour.toString().padStart(2, '0')}:${departureMinute.toString().padStart(2, '0')}`;
    
    const route = this.generateRoute();
    const totalDistance = route[route.length - 1].distance;
    const totalTime = (totalDistance / train.speed) * 60; // minutes

    return {
      trainId: train.id,
      trainNumber: train.number,
      trainType: train.type,
      priority: train.priority,
      route: route,
      totalDistance: totalDistance,
      averageSpeed: train.speed,
      status: 'scheduled',
      currentPosition: {
        stationId: route[0].stationId,
        distance: 0,
        blockId: null
      },
      delays: [],
      totalDelay: 0
    };
  }

  /**
   * Get departure hour based on train type
   */
  getDepartureHour(trainType) {
    switch (trainType) {
      case 'Rajdhani':
      case 'Shatabdi':
        return 6 + Math.floor(Math.random() * 4); // 6-9 AM
      case 'Express':
        return 8 + Math.floor(Math.random() * 8); // 8 AM - 4 PM
      case 'Local':
        return 5 + Math.floor(Math.random() * 12); // 5 AM - 5 PM
      case 'Freight':
        return 10 + Math.floor(Math.random() * 8); // 10 AM - 6 PM
      default:
        return 8 + Math.floor(Math.random() * 8);
    }
  }

  /**
   * Generate route for a train
   */
  generateRoute() {
    const stations = [...this.stations];
    const route = [];
    let currentDistance = 0;

    for (let i = 0; i < stations.length; i++) {
      const station = stations[i];
      const arrivalTime = this.calculateArrivalTime(currentDistance, 80); // Average speed
      const departureTime = this.calculateDepartureTime(arrivalTime, station.id);

      route.push({
        stationId: station.id,
        stationName: station.name,
        arrivalTime: arrivalTime,
        departureTime: departureTime,
        distance: currentDistance,
        platform: station.platforms[Math.floor(Math.random() * station.platforms.length)]
      });

      if (i < stations.length - 1) {
        currentDistance += this.blocks[i].length;
      }
    }

    return route;
  }

  /**
   * Calculate arrival time based on distance and speed
   */
  calculateArrivalTime(distance, speed) {
    const minutes = (distance / speed) * 60;
    const baseTime = moment().startOf('day').add(6, 'hours'); // Start from 6 AM
    return baseTime.add(minutes, 'minutes').format('HH:mm');
  }

  /**
   * Calculate departure time based on arrival time and station
   */
  calculateDepartureTime(arrivalTime, stationId) {
    const arrival = moment(arrivalTime, 'HH:mm');
    const dwellTime = this.getDwellTime(stationId);
    return arrival.add(dwellTime, 'minutes').format('HH:mm');
  }

  /**
   * Get dwell time based on station
   */
  getDwellTime(stationId) {
    const dwellTimes = {
      'A': 5, // 5 minutes
      'B': 8, // 8 minutes
      'C': 6, // 6 minutes
      'D': 7  // 7 minutes
    };
    return dwellTimes[stationId] || 5;
  }

  /**
   * Seed initial data
   */
  async seedInitialData() {
    // Clear existing data
    await TrainPosition.deleteMany({});
    await Conflict.deleteMany({});
    
    logger.info('Initial data seeded');
  }

  /**
   * Start the simulation
   */
  async startSimulation() {
    if (this.isRunning) {
      logger.warn('Simulation is already running');
      return;
    }

    this.isRunning = true;
    this.simulationInterval = setInterval(async () => {
      await this.simulationStep();
    }, 1000); // Update every second

    logger.info('Simulation started');
  }

  /**
   * Stop the simulation
   */
  stopSimulation() {
    if (!this.isRunning) {
      logger.warn('Simulation is not running');
      return;
    }

    this.isRunning = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    logger.info('Simulation stopped');
  }

  /**
   * Single simulation step
   */
  async simulationStep() {
    try {
      const currentTime = moment();
      
      // Update train positions
      await this.updateTrainPositions(currentTime);
      
      // Check for conflicts
      await this.checkForConflicts(currentTime);
      
      // Generate random events
      await this.generateRandomEvents(currentTime);
      
    } catch (error) {
      logger.error('Error in simulation step:', error);
    }
  }

  /**
   * Update train positions based on current time
   */
  async updateTrainPositions(currentTime) {
    for (const train of this.trains) {
      if (train.status === 'scheduled' || train.status === 'running') {
        const position = this.calculateTrainPosition(train, currentTime);
        
        if (position) {
          // Save position to database
          const trainPosition = new TrainPosition({
            trainId: train.trainId,
            timestamp: currentTime.toDate(),
            position: {
              stationId: position.stationId,
              blockId: position.blockId,
              distance: position.distance,
              latitude: this.getLatitude(position.distance),
              longitude: this.getLongitude(position.distance)
            },
            speed: train.averageSpeed,
            direction: 'up',
            status: train.status,
            nextStation: this.getNextStation(train, position),
            delay: train.totalDelay
          });

          await trainPosition.save();

          // Publish to Kafka
          await kafkaClient.publishMessage(
            process.env.KAFKA_TRAIN_POSITIONS_TOPIC || 'train-positions',
            {
              trainId: train.trainId,
              timestamp: currentTime.toISOString(),
              position: trainPosition.position,
              speed: train.averageSpeed,
              status: train.status,
              delay: train.totalDelay
            },
            train.trainId
          );

          // Update train status
          if (train.status === 'scheduled' && position.distance > 0) {
            train.status = 'running';
            await TrainSchedule.findByIdAndUpdate(train._id, { status: 'running' });
          }
        }
      }
    }
  }

  /**
   * Calculate train position at given time
   */
  calculateTrainPosition(train, currentTime) {
    const departureTime = moment(train.route[0].departureTime, 'HH:mm');
    
    if (currentTime.isBefore(departureTime)) {
      return null; // Train hasn't departed yet
    }

    const elapsedMinutes = currentTime.diff(departureTime, 'minutes');
    const distanceTraveled = (train.averageSpeed / 60) * elapsedMinutes;
    
    if (distanceTraveled >= train.totalDistance) {
      return null; // Train has completed journey
    }

    // Find current block
    let currentBlock = null;
    let currentStation = null;
    let blockDistance = 0;

    for (const block of this.blocks) {
      if (distanceTraveled >= blockDistance && distanceTraveled < blockDistance + block.length) {
        currentBlock = block;
        currentStation = this.stations.find(s => s.id === block.from);
        break;
      }
      blockDistance += block.length;
    }

    return {
      stationId: currentStation?.id || 'A',
      blockId: currentBlock?.id || 'A-B',
      distance: distanceTraveled
    };
  }

  /**
   * Check for conflicts between trains
   */
  async checkForConflicts(currentTime) {
    const activeTrains = await TrainPosition.find({
      timestamp: {
        $gte: currentTime.clone().subtract(1, 'minute').toDate(),
        $lte: currentTime.toDate()
      }
    }).sort({ timestamp: -1 });

    // Group by block
    const blockOccupancy = {};
    for (const train of activeTrains) {
      const blockId = train.position.blockId;
      if (!blockOccupancy[blockId]) {
        blockOccupancy[blockId] = [];
      }
      blockOccupancy[blockId].push(train);
    }

    // Check for conflicts
    for (const [blockId, trains] of Object.entries(blockOccupancy)) {
      if (trains.length > 1) {
        await this.createConflict(blockId, trains, currentTime);
      }
    }
  }

  /**
   * Create a conflict record
   */
  async createConflict(blockId, trains, currentTime) {
    const conflictId = `conflict_${blockId}_${Date.now()}`;
    
    // Check if conflict already exists
    const existingConflict = await Conflict.findOne({
      'location.blockId': blockId,
      status: { $in: ['detected', 'analyzing'] }
    });

    if (existingConflict) {
      return; // Conflict already exists
    }

    const block = this.blocks.find(b => b.id === blockId);
    const station = this.stations.find(s => s.id === block.from);

    const conflict = new Conflict({
      conflictId,
      conflictType: 'block',
      severity: this.calculateConflictSeverity(trains),
      trains: trains.map(train => ({
        trainId: train.trainId,
        trainType: this.getTrainType(train.trainId),
        priority: this.getTrainPriority(train.trainId),
        currentPosition: train.position,
        estimatedArrival: currentTime.clone().add(5, 'minutes').toDate()
      })),
      location: {
        stationId: station.id,
        stationName: station.name,
        blockId: blockId,
        blockName: `${station.name} Block`,
        coordinates: {
          latitude: this.getLatitude(block.from === 'A' ? 0 : 25),
          longitude: this.getLongitude(block.from === 'A' ? 0 : 25)
        }
      },
      conflictTime: currentTime.clone().add(2, 'minutes').toDate(),
      description: `Multiple trains in block ${blockId}`,
      status: 'detected',
      impact: {
        affectedTrains: trains.map(t => t.trainId),
        estimatedDelay: 10,
        throughputImpact: -2,
        passengerImpact: trains.length * 50
      }
    });

    await conflict.save();

    // Publish conflict event to Kafka
    await kafkaClient.publishMessage(
      process.env.KAFKA_TRAIN_EVENTS_TOPIC || 'train-events',
      {
        eventType: 'conflict_detected',
        conflictId,
        timestamp: currentTime.toISOString(),
        conflict: conflict.toObject()
      },
      conflictId
    );

    logger.info(`Conflict detected: ${conflictId}`);
  }

  /**
   * Generate random events (delays, breakdowns, etc.)
   */
  async generateRandomEvents(currentTime) {
    // 5% chance of random event per simulation step
    if (Math.random() < 0.05) {
      const eventType = this.getRandomEventType();
      await this.generateEvent(eventType, currentTime);
    }
  }

  /**
   * Get random event type
   */
  getRandomEventType() {
    const events = ['delay', 'breakdown', 'signal_failure', 'weather'];
    return events[Math.floor(Math.random() * events.length)];
  }

  /**
   * Generate specific event
   */
  async generateEvent(eventType, currentTime) {
    const train = this.trains[Math.floor(Math.random() * this.trains.length)];
    
    switch (eventType) {
      case 'delay':
        await this.generateDelayEvent(train, currentTime);
        break;
      case 'breakdown':
        await this.generateBreakdownEvent(train, currentTime);
        break;
      case 'signal_failure':
        await this.generateSignalFailureEvent(currentTime);
        break;
      case 'weather':
        await this.generateWeatherEvent(currentTime);
        break;
    }
  }

  /**
   * Generate delay event
   */
  async generateDelayEvent(train, currentTime) {
    const delayMinutes = 5 + Math.floor(Math.random() * 20); // 5-25 minutes
    
    train.totalDelay += delayMinutes;
    train.delays.push({
      stationId: train.currentPosition.stationId,
      delayMinutes,
      reason: 'Operational delay',
      timestamp: currentTime.toDate()
    });

    await TrainSchedule.findByIdAndUpdate(train._id, {
      totalDelay: train.totalDelay,
      delays: train.delays
    });

    // Publish event to Kafka
    await kafkaClient.publishMessage(
      process.env.KAFKA_TRAIN_EVENTS_TOPIC || 'train-events',
      {
        eventType: 'train_delay',
        trainId: train.trainId,
        delayMinutes,
        reason: 'Operational delay',
        timestamp: currentTime.toISOString()
      },
      train.trainId
    );

    logger.info(`Delay event: ${train.trainId} delayed by ${delayMinutes} minutes`);
  }

  /**
   * Generate breakdown event
   */
  async generateBreakdownEvent(train, currentTime) {
    train.status = 'breakdown';
    
    await TrainSchedule.findByIdAndUpdate(train._id, { status: 'breakdown' });

    // Publish event to Kafka
    await kafkaClient.publishMessage(
      process.env.KAFKA_TRAIN_EVENTS_TOPIC || 'train-events',
      {
        eventType: 'train_breakdown',
        trainId: train.trainId,
        location: train.currentPosition,
        timestamp: currentTime.toISOString()
      },
      train.trainId
    );

    logger.info(`Breakdown event: ${train.trainId} broke down`);
  }

  /**
   * Generate signal failure event
   */
  async generateSignalFailureEvent(currentTime) {
    const block = this.blocks[Math.floor(Math.random() * this.blocks.length)];
    
    // Publish event to Kafka
    await kafkaClient.publishMessage(
      process.env.KAFKA_TRAIN_EVENTS_TOPIC || 'train-events',
      {
        eventType: 'signal_failure',
        blockId: block.id,
        estimatedRepairTime: 30, // minutes
        timestamp: currentTime.toISOString()
      },
      block.id
    );

    logger.info(`Signal failure: ${block.id}`);
  }

  /**
   * Generate weather event
   */
  async generateWeatherEvent(currentTime) {
    const weatherTypes = ['heavy_rain', 'fog', 'heat_wave'];
    const weatherType = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    
    // Publish event to Kafka
    await kafkaClient.publishMessage(
      process.env.KAFKA_TRAIN_EVENTS_TOPIC || 'train-events',
      {
        eventType: 'weather_alert',
        weatherType,
        impact: 'speed_restriction',
        timestamp: currentTime.toISOString()
      },
      'weather'
    );

    logger.info(`Weather event: ${weatherType}`);
  }

  // Helper methods
  calculateConflictSeverity(trains) {
    const hasExpress = trains.some(t => this.getTrainType(t.trainId) === 'Express' || this.getTrainType(t.trainId) === 'Rajdhani');
    const trainCount = trains.length;
    
    if (hasExpress && trainCount > 2) return 'critical';
    if (hasExpress || trainCount > 3) return 'high';
    if (trainCount > 2) return 'medium';
    return 'low';
  }

  getTrainType(trainId) {
    const train = this.trains.find(t => t.trainId === trainId);
    return train ? train.trainType : 'Local';
  }

  getTrainPriority(trainId) {
    const train = this.trains.find(t => t.trainId === trainId);
    return train ? train.priority : 5;
  }

  getNextStation(train, position) {
    const currentIndex = train.route.findIndex(station => station.stationId === position.stationId);
    if (currentIndex < train.route.length - 1) {
      return train.route[currentIndex + 1];
    }
    return null;
  }

  getLatitude(distance) {
    // Mock latitude calculation
    return 28.6139 + (distance / 1000) * 0.01;
  }

  getLongitude(distance) {
    // Mock longitude calculation
    return 77.2090 + (distance / 1000) * 0.01;
  }
}

export const dataSimulator = new DataSimulator();