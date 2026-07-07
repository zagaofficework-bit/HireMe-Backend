const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting
 * 
 * Prevents abuse — if someone hits your API 1000 times per second
 * (a bot, DDoS, brute force), rate limiting blocks them.
 * 
 * We have different limits for different routes:
 *  - General API: 100 requests per 15 minutes (normal usage)
 *  - Auth routes: 20 requests per 15 minutes (stricter, prevents brute force)
 *  - Upload routes: 10 per hour (expensive operations)
 */
const isDev = process.env.NODE_ENV === 'development';

// General API limiter — applied globally
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 100,
  standardHeaders: true,     // sends RateLimit headers in response
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
 max: isDev ? 200 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts. Please try again after 15 minutes.',
  },
});

// Browse/search limiter — read-only, hit repeatedly during normal use
// (category clicks, subcategory switches, pagination, filter changes,
// autocomplete). These are cheap reads, not the kind of endpoint the
// 100/15min general limit was designed to guard against — that limit
// is easily exhausted just by browsing normally, well before any actual
// abuse. Apply this to /search, /categories instead of apiLimiter.
const browseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
   max: isDev ? 2000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again shortly.',
  },
});

// Upload limiter — file uploads are expensive
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload limit reached. Please try again after 1 hour.',
  },
});

module.exports = { apiLimiter, authLimiter, uploadLimiter, browseLimiter };