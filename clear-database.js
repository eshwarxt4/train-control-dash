#!/usr/bin/env node

// Database Cleanup Script
// This script clears all collections to resolve duplicate key issues

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

// Also try loading from current directory
if (!process.env.MONGO_URI) {
  dotenv.config({ path: '.env' });
}

console.log('🧹 Database Cleanup Script');
console.log('========================');

// Display connection details (without password)
const mongoUri = process.env.MONGO_URI;
if (mongoUri) {
  const maskedUri = mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log('Connection String:', maskedUri);
} else {
  console.log('❌ MONGO_URI not found in environment variables');
  process.exit(1);
}

console.log('');

// Cleanup function
async function cleanupDatabase() {
  try {
    console.log('⏳ Connecting to database...');
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Connected to MongoDB successfully!');
    console.log('');

    // Get database instance
    const db = mongoose.connection.db;
    
    // List of collections to clear
    const collectionsToClear = [
      'trainschedules',
      'trainpositions', 
      'conflicts',
      'optimizationresults',
      'decisionlogs'
    ];

    console.log('🗑️ Clearing collections...');
    
    for (const collectionName of collectionsToClear) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          await collection.deleteMany({});
          console.log(`   ✅ Cleared ${collectionName} (${count} documents)`);
        } else {
          console.log(`   ℹ️ ${collectionName} is already empty`);
        }
      } catch (error) {
        console.log(`   ⚠️ Could not clear ${collectionName}: ${error.message}`);
      }
    }

    console.log('');
    console.log('🎉 Database cleanup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your application with ./start-mvp.sh');
    console.log('2. The application will automatically seed fresh data');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.log('');
    console.log('❌ Cleanup failed!');
    console.log('Error Details:');
    console.log('   - Code:', error.code);
    console.log('   - Message:', error.message);
    
    process.exit(1);
  }
}

// Run the cleanup
cleanupDatabase();