import mongoose from 'mongoose';
import dns from 'dns';

export const connectDatabase = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
      console.log(`📊 Database: ${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 Mongoose connection closed (SIGINT)');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      console.log('🔌 Mongoose connection closed (SIGTERM)');
      process.exit(0);
    });

  } catch (error: any) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};
