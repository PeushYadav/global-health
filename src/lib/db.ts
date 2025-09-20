// lib/db.ts
import mongoose from 'mongoose';

// HARD-CODED for local dev only
const MONGODB_URI = 'mongodb://127.0.0.1:27017/users';

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Reuse connection across hot reloads / routes
let cached = (global as any).mongoose as MongooseCache;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { autoIndex: true })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
