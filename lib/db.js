// lib/db.js
// MongoDB connection helper, cached across serverless invocations (Vercel best practice).
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'dramahouse';

if (!MONGODB_URI) {
  console.warn('MONGODB_URI is not set. Set it in your Vercel project environment variables.');
}

let cached = global._mongoCached;
if (!cached) {
  cached = global._mongoCached = { client: null, db: null, promise: null };
}

async function getDb() {
  if (cached.db) return cached.db;

  if (!cached.promise) {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 5,
    });
    cached.promise = client.connect().then((client) => {
      cached.client = client;
      cached.db = client.db(DB_NAME);
      return cached.db;
    });
  }

  cached.db = await cached.promise;
  return cached.db;
}

module.exports = { getDb };
