import mongoose from 'mongoose';
import Chat from '../models/chat.model.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'chat-service'
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Drop problematic indexes on startup
    try {
      await Chat.collection.dropIndexes();
      console.log('🗑️ Dropped old indexes');
      
      // Recreate indexes from schema
      await Chat.createIndexes();
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
    process.exit(1);
  }
};