import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function dropAllIndexes() {
  try {
    const mongoURI = `${process.env.MONGODB_URI}/${process.env.DB_NAME}`;
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`Dropping indexes for: ${collectionName}`);
      
      try {
        await db.collection(collectionName).dropIndexes();
        console.log(`✓ Dropped indexes for ${collectionName}`);
      } catch (error: any) {
        console.log(`⚠ Could not drop indexes for ${collectionName}: ${error.message}`);
      }
    }
    
    console.log('\n✅ All indexes dropped successfully!');
    console.log('Indexes will be recreated when you start the server.\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropAllIndexes();