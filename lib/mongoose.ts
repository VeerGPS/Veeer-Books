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

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not configured");
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGO_URI, { bufferCommands: false })
      .then((m) => {
        console.log("[mongoose] connected");
        return m;
      })
      .catch((err) => {
        console.error("[mongoose] connection error:", err.message);
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
