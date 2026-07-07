const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const {
  registerUser,
  registerClient,
  getUserByFirebaseUid,
  updateLastLogin,
  googleAuth,
} = require('../../services/auth/auth.service');

/**
 * POST /api/v1/auth/register/user
 */
const registerUserController = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  const user = await registerUser({
    firebaseUid: req.firebaseUser.uid,
    name,
    email: email || req.firebaseUser.email,
    phone: phone || req.firebaseUser.phone_number,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { user }, 'User registered successfully'));
});

/**
 * POST /api/v1/auth/register/client
 */
const registerClientController = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  const user = await registerClient({
    firebaseUid: req.firebaseUser.uid,
    name,
    email: email || req.firebaseUser.email,
    phone: phone || req.firebaseUser.phone_number,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { user }, 'Client registered successfully'));
});

/**
 * POST /api/v1/auth/google
 *
 * Called by the frontend after a successful Firebase Google sign-in.
 * Handles both first-time registration AND returning login in one shot:
 *   - If the firebaseUid already exists in MongoDB → update lastLogin, return existing user
 *   - If it's new → create the MongoDB profile with the correct role
 *
 * The frontend sends { role } ('user' | 'client') from the role toggle
 * so we know which profile type to create on first sign-in.
 *
 * Requires: verifyFirebaseToken middleware (Firebase token in Authorization header)
 */
const googleAuthController = asyncHandler(async (req, res) => {
  // role comes from sessionStorage.pendingRole set before Google sign-in
  const { role } = req.body;

  const user = await googleAuth({
    firebaseUid: req.firebaseUser.uid,
    name:  req.firebaseUser.name  || req.firebaseUser.email?.split('@')[0] || 'User',
    email: req.firebaseUser.email || undefined,
    phone: req.firebaseUser.phone_number || undefined,
    // Default to 'user' (freelancer) if role not provided
    role: role === 'client' ? 'client' : 'user',
  });

  // requiresMobile tells the frontend to route into the OTP flow
  // to link/verify a phone number (Google accounts don't always have one)
  const requiresMobile = !user.phone && !user.isPhoneVerified;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user, requiresMobile },
        requiresMobile ? 'Phone number required' : 'Google auth successful'
      )
    );
});

/**
 * GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  await updateLastLogin(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user }, 'Profile fetched'));
});

module.exports = {
  registerUserController,
  registerClientController,
  googleAuthController,
  getMe,
};