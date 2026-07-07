require("dotenv").config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

/**
 * Server Entry Point
 * 
 * Flow:
 * 1. Connect to MongoDB
 * 2. If successful → start Express server
 * 3. If DB fails → process exits (no point running without DB)
 * 
 * Why connectDB().then()?
 * We WAIT for DB connection before accepting requests.
 * If server started before DB connected, the first requests would fail.
 */
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Hyrd server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
    console.log(`❤️  Health: http://localhost:${PORT}/health`);
  });

  // ── Graceful Shutdown ─────────────────────────────────────────
  /**
   * On SIGTERM (Render/Hostinger sends this when shutting down):
   * - Stop accepting new requests
   * - Wait for existing requests to finish
   * - Then exit cleanly
   * Without this, active requests would be cut off mid-response.
   */
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });

  // Handle uncaught errors — log and exit so the process manager restarts
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err.message);
    server.close(() => process.exit(1));
  });
};

startServer();