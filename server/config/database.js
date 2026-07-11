const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/svga-book-bank';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  if (!process.env.MONGODB_URI) {
    console.warn('[DB] MONGODB_URI not set, using local default URI');
  }

  try {
    let hostName = uri;
    try {
      const parsed = new URL(uri);
      hostName = parsed.host || parsed.hostname || uri;
    } catch (parseError) {
      hostName = uri;
    }

    console.log(`[DB] MongoDB URI host: ${hostName}`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('[DB] MongoDB Connected');
    return true;
  } catch (error) {
    console.error('[DB] MongoDB Connection Failed:');
    console.error(error.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    console.warn('[DB] Continuing without MongoDB in non-production mode');
    return false;
  }
};

module.exports = connectDB;
