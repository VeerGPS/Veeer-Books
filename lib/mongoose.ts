// Cached Mongoose connection for serverless / Next.js API routes.
// Prevents the "MongooseError: cannot create more than X connections" issue
// that arises when each invocation re-connects.
//
// Pattern documented in Next.js + Mongoose guide.

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  // We do NOT throw at module load — that would crash the entire app on missing
  // env. We surface a useful error only when a connection is actually requested.
  console.warn("[mongoose] MONGO_URI is not set — DB calls will fail");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
if (!global._mongooseCache) global._mongooseCache = cache;

// When the database is unreachable we remember the failure for a short time so
// every page request doesn't sit waiting for another connection timeout before
// falling back to the built-in catalogue. (This was a major cause of slow pages.)
const FAILURE_BACKOFF_MS = 30_000;
let lastFailureAt = 0;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;

  if (!MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not configured");
  }

  if (!cache.promise && Date.now() - lastFailureAt < FAILURE_BACKOFF_MS) {
    throw new Error("[mongoose] database recently unreachable — using fallback");
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGO_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000, // fail fast instead of the 30s default
        connectTimeoutMS: 8000,
        maxPoolSize: 10,
      })
      .then((m) => {
        console.log("[mongoose] connected");
        return m;
      })
      .catch((err) => {
        console.error("[mongoose] connection error:", err.message);
        cache.promise = null;
        cache.conn = null;
        lastFailureAt = Date.now();
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
