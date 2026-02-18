import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

console.log('Testing MongoDB connection...');
console.log('URI:', uri?.replace(/:[^:@]+@/, ':****@')); // Hide password

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
});

async function test() {
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');

    const db = client.db('insurelead');
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

test();
