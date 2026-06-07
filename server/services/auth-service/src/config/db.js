import mongoose from 'mongoose';
import dns from 'dns';

const connectDB = async () => {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected (Auth Service)');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export default connectDB;
