import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    console.log('DEBUG: Attempting MongoDB connection (Ticket Service)...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log('✅ MongoDB connected (Ticket Service)');
  } catch (err) {
    console.error('❌ MongoDB connection failed (Ticket Service):', err.message);
    // process.exit(1);
  }
};
export default connectDB;