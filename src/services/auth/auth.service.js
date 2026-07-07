const User = require('../../models/auth/auth.model');
const ApiError = require('../../utils/ApiError');

/**
 * Register a new user (role: 'user' / freelancer)
 */
const registerUser = async ({ firebaseUid, name, email, phone }) => {
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
    isEmailVerified: !!email,
    isPhoneVerified: !!phone,
  });

  return user;
};

/**
 * Register a new client (role: 'client')
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
    isPhoneVerified: !!phone,
  });

  return user;
};

/**
 * Google Auth — upsert logic
 *
 * Called from googleAuthController after Firebase Google sign-in.
 * - Existing user  → bump lastLoginAt, return as-is (role never changes)
 * - New user       → create profile with the chosen role
 *
 * We intentionally do NOT overwrite role for returning users so a
 * freelancer can't accidentally become a client by toggling the pill
 * on a subsequent login.
 */
const googleAuth = async ({ firebaseUid, name, email, phone, role }) => {
  // Returning user — just refresh last-login and return
  const existing = await User.findOneAndUpdate(
    { firebaseUid },
    { lastLoginAt: new Date() },
    { new: true }
  );
  if (existing) return existing;

  // First-time Google user — create their profile
  const user = await User.create({
    firebaseUid,
    name,
    email: email || undefined,
    phone: phone || undefined,
    role: role === 'client' ? 'client' : 'user',
    status: 'active',
    isEmailVerified: !!email,   // Google accounts have verified emails
    isPhoneVerified: !!phone,
    lastLoginAt: new Date(),
  });

  return user;
};

/**
 * Get user by Firebase UID
 */
const getUserByFirebaseUid = async (firebaseUid) => {
  const user = await User.findOne({ firebaseUid });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

/**
 * Update last login timestamp
 */
const updateLastLogin = async (userId) => {
  await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
};

module.exports = {
  registerUser,
  registerClient,
  googleAuth,
  getUserByFirebaseUid,
  updateLastLogin,
};