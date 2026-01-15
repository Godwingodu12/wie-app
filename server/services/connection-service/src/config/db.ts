import mongoose from 'mongoose';
export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoURI = `${process.env.MONGODB_URI}/${process.env.DB_NAME}`;
    const options = {
      maxPoolSize: 100, // Increased for 800M users
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };
    await mongoose.connect(mongoURI, options);
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
    });
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected from MongoDB');
    });
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed through app termination');
      process.exit(0);
    });
  } catch (error: any) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};