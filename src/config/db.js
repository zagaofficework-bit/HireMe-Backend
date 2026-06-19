const mongoose = require('mongoose');

/**
 * connectDB()
 * Connects to MongoDB Atlas using the MONGO_URI from .env
 * Called once when server starts.
 * If it fails, we exit the process — no point running the server without a DB.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options prevent deprecation warnings and
      // ensure stable connection behavior in production
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1); // Exit with failure code — crash early, crash loudly
  }
};

module.exports = connectDB;