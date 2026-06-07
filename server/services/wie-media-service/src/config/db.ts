import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Force DNS to use Google's servers to resolve MongoDB SRV records reliably
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI!;
    if (!uri) {
      throw new Error('MONGO_URI is not defined');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ MongoDB Atlas connected (media-service)');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

export default connectDB;