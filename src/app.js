require('dotenv').config();

// Initialize Firebase Admin before anything else
require('./config/firebase');

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
//const mongoSanitize = require('express-mongo-sanitize');

const { apiLimiter }  = require('./middlewares/rateLimiter.middleware');
const errorHandler    = require('./middlewares/error.middleware');
const routes          = require('./routes/index');

const app = express();

// ── Security Headers ──────────────────────────────────────────────
/**
 * helmet sets secure HTTP headers:
 *  - X-Content-Type-Options: nosniff
 *  - X-Frame-Options: DENY (prevent clickjacking)
 *  - Strict-Transport-Security (force HTTPS)
 *  - And more...
 */
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────
/**
 * CORS (Cross-Origin Resource Sharing):
 * Controls which frontend domains can call your API.
 * In development: allow localhost:3000
 * In production: allow only your deployed frontend domain
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin} not allowed`));
    },
    credentials: true, // allow cookies if needed later
  })
);

// ── Request Parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));           // parse JSON body (limit prevents huge payloads)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── NoSQL Injection Protection ────────────────────────────────────
/**
 * mongoSanitize removes $ and . from request body/params
 * Prevents attacks like: { "email": { "$gt": "" } }
 * which could bypass MongoDB queries
 */
//app.use(mongoSanitize());

// ── Logging ───────────────────────────────────────────────────────
// morgan logs every request: method, path, status, response time
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));     // compact colored output in dev
} else {
  app.use(morgan('combined')); // Apache-style logs in production
}

// ── Global Rate Limiter ───────────────────────────────────────────
// Applied to all /api routes — 100 req per 15 min per IP
app.use('/api', apiLimiter);

// ── Health Check ─────────────────────────────────────────────────
// Simple endpoint to confirm server is running (used by Render/Hostinger monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HireMe API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── 404 Handler ───────────────────────────────────────────────────
// If no route matched, send a clean 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler ──────────────────────────────────────────
// Must be LAST — catches all errors forwarded by next(err)
app.use(errorHandler);

module.exports = app;