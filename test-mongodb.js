#!/usr/bin/env node

// MongoDB Connection Test Script
// This script tests the MongoDB connection independently

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

console.log('🔍 Testing MongoDB Connection...');
console.log('================================');

// Display connection details (without password)
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  const maskedUri = mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log('Connection String:', maskedUri);
} else {
  console.log('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

console.log('');

// Test connection
async function testConnection() {
  try {
    console.log('⏳ Attempting to connect...');
    
    const connection = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Increased timeout for testing
      socketTimeoutMS: 45000,
    });

    console.log('✅ Successfully connected to MongoDB!');
    console.log('📊 Connection Details:');
    console.log('   - Host:', connection.connection.host);
    console.log('   - Port:', connection.connection.port);
    console.log('   - Database:', connection.connection.name);
    console.log('   - Ready State:', connection.connection.readyState);

    // Test basic operations
    console.log('');
    console.log('🧪 Testing basic operations...');
    
    const testCollection = connection.connection.db.collection('connection_test');
    
    // Insert test document
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'Connection test successful'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ Insert test passed:', insertResult.insertedId);
    
    // Find test document
    const findResult = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('✅ Find test passed:', findResult ? 'Document found' : 'Document not found');
    
    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Delete test passed: Test document cleaned up');

    console.log('');
    console.log('🎉 All tests passed! MongoDB connection is working correctly.');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.log('');
    console.log('❌ Connection failed!');
    console.log('Error Details:');
    console.log('   - Code:', error.code);
    console.log('   - Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('🔧 Troubleshooting ECONNREFUSED:');
      console.log('   1. Check if your IP address is whitelisted in MongoDB Atlas');
      console.log('   2. Verify the cluster is running (not paused)');
      console.log('   3. Check if the connection string is correct');
      console.log('   4. Ensure your internet connection is working');
    } else if (error.code === 'ENOTFOUND') {
      console.log('');
      console.log('🔧 Troubleshooting ENOTFOUND:');
      console.log('   1. Check if the cluster URL is correct');
      console.log('   2. Verify the cluster name in the connection string');
    } else if (error.code === 'EAUTH') {
      console.log('');
      console.log('🔧 Troubleshooting EAUTH:');
      console.log('   1. Check if username and password are correct');
      console.log('   2. Verify the database user has proper permissions');
    }
    
    console.log('');
    console.log('📚 For more help, check: https://docs.atlas.mongodb.com/');
    
    process.exit(1);
  }
}

// Run the test
testConnection();