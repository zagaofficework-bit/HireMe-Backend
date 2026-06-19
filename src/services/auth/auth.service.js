const User = require('../../models/auth/auth.model');
const ApiError = require('../../utils/ApiError');

/**
 * Auth Service
 * 
 * Services contain the BUSINESS LOGIC.
 * Controllers just call services — they don't do the work themselves.
 * This keeps controllers thin and logic reusable.
 */

/**
 * Register a new user (role: 'user')
 * Called after Firebase creates the account on frontend.
 * We create their MongoDB profile with role = 'user'.
 */
const registerUser = async ({ firebaseUid, name, email, phone }) => {
  // Check if already registered (e.g. double-submit)
  const existing = await User.findOne({ firebaseUid });
  if (existing) {
    throw new ApiError(409, 'Account already registered');
  }

  const user = await User.create({
    firebaseUid,
    name,
    email: email || undefined,
    phone: phone || undefined,
    role: 'user',
    status: 'active',
    isEmailVerified: !!email, // Firebase already verified email if they used email auth
  });

  return user;
};

/**
 * Register a new client (role: 'client')
 * Same flow but role is permanently set to 'client'
 */
const registerClient = async ({ firebaseUid, name, email, phone }) => {
  const existing = await User.findOne({ firebaseUid });
  if (existing) {
    throw new ApiError(409, 'Account already registered');
  }

  const user = await User.create({
    firebaseUid,
    name,
    email: email || undefined,
    phone: phone || undefined,
    role: 'client',
    status: 'active',
    isEmailVerified: !!email,
  });

  return user;
};

/**
 * Get user by Firebase UID
 * Used by the protect middleware and getMe controller
 */
const getUserByFirebaseUid = async (firebaseUid) => {
  const user = await User.findOne({ firebaseUid });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

/**
 * Update last login timestamp
 * Called when user hits /me after login
 */
const updateLastLogin = async (userId) => {
  await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
};

module.exports = {
  registerUser,
  registerClient,
  getUserByFirebaseUid,
  updateLastLogin,
};