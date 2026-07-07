const admin = require('../config/firebase');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/auth/auth.model');

// Firebase error codes that mean the token is expired/invalid (not a server bug)
// Without this, Firebase throws a raw error with no statusCode, which the global
// error handler turns into a 500 — so the frontend never sees a 401 and the
// response interceptor's token-refresh logic never triggers.
const FIREBASE_TOKEN_ERRORS = new Set([
  'auth/id-token-expired',     // token older than 1 hour
  'auth/id-token-revoked',     // token manually revoked (e.g. password change)
  'auth/argument-error',       // malformed token string
  'auth/invalid-id-token',     // token failed signature check
  'auth/user-disabled',        // Firebase account disabled
]);

/**
 * verifyToken — shared helper used by all three middlewares below.
 *
 * Wraps admin.auth().verifyIdToken() and maps Firebase errors to proper
 * ApiError(401) so the global error handler always returns a 401 (not 500)
 * when the token is bad. The frontend response interceptor depends on this.
 */
const verifyToken = async (idToken) => {
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    if (FIREBASE_TOKEN_ERRORS.has(err.code)) {
      // Token is expired or invalid — client should refresh and retry
      throw new ApiError(401, 'Token expired or invalid. Please login again.');
    }
    // Unexpected Firebase/network error — still a 401 from the client's POV
    throw new ApiError(401, 'Token verification failed. Please login again.');
  }
};

/**
 * protect
 *
 * How Firebase auth works with your backend:
 *
 * 1. User logs in on frontend using Firebase (Google, email, phone)
 * 2. Firebase gives frontend an "ID Token" (a long JWT string)
 * 3. Frontend sends this token in every API request:
 *    Headers: { Authorization: "Bearer <idToken>" }
 * 4. THIS middleware receives that token
 * 5. We ask Firebase: "Is this token valid?"
 * 6. If yes → we get the user's Firebase UID
 * 7. We fetch their profile from our MongoDB
 * 8. Attach to req.user so controllers can use it
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'No token provided. Please login.');
  }

  const idToken = authHeader.split('Bearer ')[1];

  // verifyToken throws ApiError(401) on any Firebase error — not 500
  const decoded = await verifyToken(idToken);

  // decoded contains: uid, email, phone_number, email_verified, etc.
  // Now fetch the full user profile from our own DB
  const user = await User.findOne({ firebaseUid: decoded.uid });

  if (!user) {
    throw new ApiError(404, 'Account not found. Please complete registration.');
  }

  if (user.status === 'banned') {
    throw new ApiError(403, 'Your account has been banned. Contact support.');
  }

  if (user.status === 'suspended') {
    throw new ApiError(403, 'Your account is suspended. Contact support.');
  }

  // Attach user to request — available in all subsequent controllers
  req.user = user;
  next();
});

/**
 * optionalAuth
 *
 * For routes that work for both guests AND logged-in users.
 * Example: viewing a public profile — guests see limited data,
 * logged-in clients see contact details.
 *
 * Does NOT throw an error if no token — just sets req.user = null
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await verifyToken(idToken); // uses shared helper
    const user = await User.findOne({ firebaseUid: decoded.uid });
    req.user = user || null;
  } catch {
    // Any error (expired token, bad token, DB miss) → treat as guest
    req.user = null;
  }

  next();
});

/**
 * verifyFirebaseToken
 *
 * Lighter version of protect — ONLY verifies the Firebase token.
 * Does NOT require the user to exist in our MongoDB yet.
 * Used specifically for /register routes where the user is NEW.
 *
 * After verification, req.firebaseUser contains:
 *   { uid, email, phone_number, email_verified }
 */
const verifyFirebaseToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'No token provided. Please login with Firebase first.');
  }

  const idToken = authHeader.split('Bearer ')[1];

  // verifyToken throws ApiError(401) on any Firebase error — not 500
  const decoded = await verifyToken(idToken);

  req.firebaseUser = decoded; // uid, email, phone_number available
  next();
});

module.exports = { protect, optionalAuth, verifyFirebaseToken };