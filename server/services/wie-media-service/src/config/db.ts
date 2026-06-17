import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    console.log('DEBUG: Attempting MongoDB connection (Media Service)...');
    await mongoose.connect(uri);
    console.log('✅ MongoDB Atlas connected (media-service)');
  } catch (error: any) {
    console.error('❌ MongoDB connection failed (Media Service):', error.message);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

export default connectDB;