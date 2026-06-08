import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://gokulgopalan51_db_user:CygJ0mw43gL01T0l@cluster0.a6jitjg.mongodb.net/media-service?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    
    const db = client.db('media-service');
    
    // 1. Clean Posts
    const postsCollection = db.collection('posts');
    const postsFilter = { "mediaItems.url": { $regex: "dh3oqqhao" } };
    const postsCount = await postsCollection.countDocuments(postsFilter);
    console.log(`Found ${postsCount} posts with old Cloudinary URLs.`);
    
    if (postsCount > 0) {
      const result = await postsCollection.updateMany(
        postsFilter,
        { $set: { isDeleted: true } }
      );
      console.log(`Soft-deleted ${result.modifiedCount} posts.`);
    }

    // 2. Clean Fluxes (Stories)
    const fluxesCollection = db.collection('fluxes');
    const fluxesFilter = { "mediaUrl": { $regex: "dh3oqqhao" } };
    const fluxesCount = await fluxesCollection.countDocuments(fluxesFilter);
    console.log(`Found ${fluxesCount} fluxes (stories) with old Cloudinary URLs.`);
    
    if (fluxesCount > 0) {
      const result = await fluxesCollection.updateMany(
        fluxesFilter,
        { $set: { isDeleted: true } }
      );
      console.log(`Soft-deleted ${result.modifiedCount} fluxes.`);
    }

    console.log("Database cleanup complete.");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
