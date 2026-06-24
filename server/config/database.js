const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const isProd = process.env.NODE_ENV === 'production';
    console.error('MONGODB_URI missing from .env');
    if (isProd) {
      process.exit(1);
    } else {
      console.warn('Skipping MongoDB connection in non-production environment');
      return;
    }
  }

  try {
    let hostName = uri;
    try {
      const parsed = new URL(uri);
      hostName = parsed.host || parsed.hostname || uri;
    } catch (parseError) {
      hostName = uri;
    }

    console.log(`MongoDB URI host: ${hostName}`);
    await mongoose.connect(uri);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Failed:');
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
