import mongoose from 'mongoose';
import Notification from '../models/notification.model.js';

export const connectDB = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'notification_db'
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Drop problematic indexes on startup
    try {
      await Notification.collection.dropIndexes();
      console.log('🗑️ Dropped old indexes');
      // Recreate indexes from schema
      await Notification.createIndexes();
      console.log('✅ Recreated indexes');
    } catch (indexError) {
      console.log('ℹ️ Index cleanup:', indexError.message);
    }
    
    // Handle MongoDB errors
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('💡 Tip: Make sure MongoDB is running and MONGODB_URI is set in .env');
    process.exit(1);
  }
};