const admin = require('../config/firebase');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/auth/auth.model');

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

  // Ask Firebase Admin: is this token real and not expired?
  const decoded = await admin.auth().verifyIdToken(idToken);

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
    const decoded = await admin.auth().verifyIdToken(idToken);
    const user = await User.findOne({ firebaseUid: decoded.uid });
    req.user = user || null;
  } catch {
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
  const decoded = await admin.auth().verifyIdToken(idToken);

  req.firebaseUser = decoded; // uid, email, phone_number available
  next();
});

module.exports = { protect, optionalAuth, verifyFirebaseToken };