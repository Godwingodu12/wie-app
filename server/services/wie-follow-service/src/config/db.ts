import mongoose from 'mongoose';

class Database {
  private isConnectedFlag = false;

  async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb+srv://gokulgopalan51_db_user:CygJ0mw43gL01T0l@cluster0.a6jitjg.mongodb.net/follow-service?retryWrites=true&w=majority&appName=Cluster0';
      
      await mongoose.connect(mongoUri);
      
      this.isConnectedFlag = true;
      console.log('✅ MongoDB connected successfully');
      
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnectedFlag = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
        this.isConnectedFlag = false;
      });
      
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      this.isConnectedFlag = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.isConnectedFlag = false;
      console.log('✅ MongoDB disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting MongoDB:', error);
      throw error;
    }
  }

  get isConnected(): boolean {
    return this.isConnectedFlag && mongoose.connection.readyState === 1;
  }
}

export default new Database();
