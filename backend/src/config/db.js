const mongoose = require('mongoose');

// Reuse the connection across warm Vercel function invocations.
let cached = global.__mongooseCache;
if (!cached) {
  cached = global.__mongooseCache = { conn: null, promise: null };
}

module.exports = async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI).then((mongooseInstance) => {
      console.log('MongoDB connected');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};
