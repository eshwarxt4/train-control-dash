import { database } from '../config/database.js';
import { dataSimulator } from '../services/DataSimulator.js';
import { logger } from '../config/logger.js';

async function startDataSimulation() {
  try {
    // Connect to database
    await database.connect();
    
    // Initialize data simulator
    await dataSimulator.initialize();
    
    logger.info('Data simulator initialized successfully');
    console.log('✅ Data simulator initialized successfully');
    
    // Start simulation
    await dataSimulator.startSimulation();
    
    logger.info('Data simulation started');
    console.log('✅ Data simulation started');
    console.log('📊 Generating real-time train data...');
    console.log('🔄 Press Ctrl+C to stop simulation');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping data simulation...');
      dataSimulator.stopSimulation();
      await database.disconnect();
      logger.info('Data simulation stopped');
      console.log('✅ Data simulation stopped');
      process.exit(0);
    });
    
    // Keep process alive
    setInterval(() => {
      // Just keep the process running
    }, 1000);
    
  } catch (error) {
    logger.error('Failed to start data simulation:', error);
    console.error('❌ Failed to start data simulation:', error.message);
    process.exit(1);
  }
}

// Run the simulation
startDataSimulation();