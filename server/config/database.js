const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const dns = require('dns').promises;

// Only import in development
const MongoMemoryServer = process.env.NODE_ENV !== 'production' ? require('mongodb-memory-server').MongoMemoryServer : null;

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/svga-book-bank';
let memoryServer = null;

const buildFallbackUriFromSrv = async (uri) => {
  const parsed = new URL(uri);
  if (parsed.protocol !== 'mongodb+srv:') return uri;

  const username = parsed.username ? decodeURIComponent(parsed.username) : '';
  const password = parsed.password ? decodeURIComponent(parsed.password) : '';
  const authPart = username ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : '';
  const host = parsed.hostname;
  const fallbackResolver = new dns.Resolver();
  fallbackResolver.setServers(['8.8.8.8', '1.1.1.1']);

  const srvRecords = await fallbackResolver.resolveSrv(`_mongodb._tcp.${host}`);
  if (!srvRecords || srvRecords.length === 0) throw new Error('No SRV records returned for Atlas cluster');

  const hosts = srvRecords.map((record) => `${record.name}:${record.port}`).join(',');

  const query = new URLSearchParams(parsed.searchParams);
  const txtRecords = await fallbackResolver.resolveTxt(host);
  txtRecords.flat().forEach((item) => {
    item.split('&').forEach((part) => {
      const [key, value] = part.split('=');
      if (key && value && !query.has(key)) {
        query.set(key, value);
      }
    });
  });

  if (!query.has('retryWrites')) query.set('retryWrites', 'true');
  if (!query.has('w')) query.set('w', 'majority');
  if (!query.has('authSource')) query.set('authSource', 'admin');
  if (!query.has('tls') && !query.has('ssl')) query.set('tls', 'true');

  return `mongodb://${authPart}${hosts}/?${query.toString()}`;
};

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

    if (uri.startsWith('mongodb+srv://')) {
      try {
        const fallbackUri = await buildFallbackUriFromSrv(uri);
        console.log('[DB] Attempting fallback non-SRV Atlas URI');
        console.log(`[DB] Fallback MongoDB URI: ${fallbackUri}`);
        await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 3000 });
        console.log('[DB] MongoDB Connected via fallback non-SRV URI');
        return true;
      } catch (fallbackError) {
        console.error('[DB] Atlas non-SRV fallback failed:');
        console.error(fallbackError.message);
      }
    }

    try {
      if (process.env.NODE_ENV === 'production') {
        console.error('[DB] Cannot connect to MongoDB in production. Exiting.');
        process.exit(1);
      }

      if (!MongoMemoryServer) {
        console.error('[DB] In-memory MongoDB not available');
        process.exit(1);
      }

      memoryServer = await MongoMemoryServer.create();
      const memoryUri = memoryServer.getUri();
      await mongoose.connect(memoryUri, { serverSelectionTimeoutMS: 3000 });
      console.log('[DB] MongoDB Connected via in-memory server');
      return true;
    } catch (memoryError) {
      console.error('[DB] In-memory MongoDB fallback failed:');
      console.error(memoryError.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
