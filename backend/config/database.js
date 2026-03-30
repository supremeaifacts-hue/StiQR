const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file in backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
  try {
    // Use a default MongoDB URI if not configured
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stiqr';
    
    console.log('=== Attempting MongoDB Connection ===');
    console.log('MongoDB URI:', mongoURI.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://***:***@'));
    
    // Set mongoose to use a mock implementation if connection fails
    mongoose.set('strictQuery', true);
    
    const conn = await mongoose.connect(mongoURI, {
      // Remove deprecated options
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log(`=== MongoDB Connected Successfully ===`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Ready State: ${conn.connection.readyState}`);
    
    return conn;
  } catch (error) {
    console.error(`=== Error connecting to MongoDB ===`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    
    // For development, we can fall back to a mock or continue without DB
    if (process.env.NODE_ENV === 'development' || !process.env.MONGODB_URI) {
      console.warn('=== Running in development mode without database connection ===');
      console.warn('To enable database features, set MONGODB_URI in your .env file');
      console.warn('Example: MONGODB_URI=mongodb://localhost:27017/stiqr');
      console.warn('For now, using mock database for development');
      
      // Create a mock connection object
      const mockConnection = {
        connection: {
          host: 'mock-database',
          name: 'stiqr-mock',
          readyState: 0
        }
      };
      
      return mockConnection;
    }
    
    process.exit(1);
  }
};

// Graceful shutdown
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};

module.exports = { connectDB, disconnectDB };
