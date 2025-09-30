import { database } from '../config/database.js';
import { TrainSchedule } from '../models/TrainSchedule.js';
import { logger } from '../config/logger.js';

async function seedDatabase() {
  try {
    // Connect to database
    await database.connect();

    // Drop collection if it exists (avoids duplicate key issues)
    try {
      await TrainSchedule.collection.drop();
      console.log("🗑️ Dropped existing TrainSchedule collection");
    } catch (err) {
      if (err.code === 26) {
        console.log("ℹ️ Collection does not exist, skipping drop");
      } else {
        throw err;
      }
    }

    // Sample train schedules
    const sampleTrains = [
      {
        trainId: 'E001',
        trainNumber: '12001',
        trainType: 'Rajdhani',
        priority: 10,
        route: [
          { stationId: 'A', stationName: 'Station Alpha', arrivalTime: '06:00', departureTime: '06:05', distance: 0, platform: '1' },
          { stationId: 'B', stationName: 'Station Beta', arrivalTime: '06:30', departureTime: '06:38', distance: 25, platform: '2' },
          { stationId: 'C', stationName: 'Station Charlie', arrivalTime: '07:00', departureTime: '07:06', distance: 50, platform: '1' },
          { stationId: 'D', stationName: 'Station Delta', arrivalTime: '07:30', departureTime: '07:30', distance: 75, platform: '3' }
        ],
        totalDistance: 75,
        averageSpeed: 120,
        status: 'scheduled',
        currentPosition: { stationId: 'A', distance: 0, blockId: null },
        delays: [],
        totalDelay: 0
      },
      {
        trainId: 'L001',
        trainNumber: '12345',
        trainType: 'Local',
        priority: 6,
        route: [
          { stationId: 'A', stationName: 'Station Alpha', arrivalTime: '06:15', departureTime: '06:20', distance: 0, platform: '2' },
          { stationId: 'B', stationName: 'Station Beta', arrivalTime: '06:50', departureTime: '06:58', distance: 25, platform: '1' },
          { stationId: 'C', stationName: 'Station Charlie', arrivalTime: '07:25', departureTime: '07:31', distance: 50, platform: '2' },
          { stationId: 'D', stationName: 'Station Delta', arrivalTime: '08:00', departureTime: '08:00', distance: 75, platform: '1' }
        ],
        totalDistance: 75,
        averageSpeed: 60,
        status: 'scheduled',
        currentPosition: { stationId: 'A', distance: 0, blockId: null },
        delays: [],
        totalDelay: 0
      },
      {
        trainId: 'F001',
        trainNumber: '12301',
        trainType: 'Freight',
        priority: 3,
        route: [
          { stationId: 'B', stationName: 'Station Beta', arrivalTime: '07:00', departureTime: '07:10', distance: 25, platform: '3' },
          { stationId: 'C', stationName: 'Station Charlie', arrivalTime: '07:45', departureTime: '07:55', distance: 50, platform: '3' },
          { stationId: 'D', stationName: 'Station Delta', arrivalTime: '08:30', departureTime: '08:30', distance: 75, platform: '2' }
        ],
        totalDistance: 50,
        averageSpeed: 45,
        status: 'scheduled',
        currentPosition: { stationId: 'B', distance: 25, blockId: null },
        delays: [],
        totalDelay: 0
      }
    ];

    // Insert sample data
    await TrainSchedule.insertMany(sampleTrains);

    logger.info(`✅ Seeded database with ${sampleTrains.length} train schedules`);
    console.log(`✅ Database seeded successfully with ${sampleTrains.length} train schedules`);

  } catch (error) {
    logger.error('❌ Failed to seed database:', error);
    console.error('❌ Failed to seed database:', error.message);
    process.exit(1);
  } finally {
    await database.disconnect();
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();
