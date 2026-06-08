import { PrismaClient } from '@prisma/client';
import { MongoClient } from 'mongodb';
import dns from 'node:dns';

// Fix DNS for MongoDB Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

const prisma = new PrismaClient();
const mongoUri = "mongodb+srv://gokulgopalan51_db_user:CygJ0mw43gL01T0l@cluster0.a6jitjg.mongodb.net/media-service?retryWrites=true&w=majority&appName=Cluster0";
const mongoClient = new MongoClient(mongoUri);

async function syncCounts() {
  try {
    await mongoClient.connect();
    console.log("Connected to MongoDB.");
    
    const db = mongoClient.db('media-service');
    const postsCollection = db.collection('posts');
    
    // Count active posts (not deleted, not story) per user
    const pipeline = [
      { $match: { isDeleted: false, isStory: false } },
      { $group: { _id: "$userId", count: { $sum: 1 } } }
    ];
    
    const results = await postsCollection.aggregate(pipeline).toArray();
    const actualCounts: Record<string, number> = {};
    for (const r of results) {
      actualCounts[r._id] = r.count;
    }
    
    // Get all users from Postgres
    const users = await prisma.wieUser.findMany({
      select: { id: true, username: true, postsCount: true }
    });
    
    let updatedCount = 0;
    
    for (const u of users) {
      const actualCount = actualCounts[u.id] || 0;
      if (u.postsCount !== actualCount) {
        console.log(`Syncing ${u.username}: ${u.postsCount} -> ${actualCount}`);
        await prisma.wieUser.update({
          where: { id: u.id },
          data: { postsCount: actualCount }
        });
        updatedCount++;
      }
    }
    
    console.log(`Sync complete. ${updatedCount} users updated.`);
  } catch (error) {
    console.error("Sync failed:", error);
  } finally {
    await prisma.$disconnect();
    await mongoClient.close();
  }
}

syncCounts();