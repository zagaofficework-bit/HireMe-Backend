const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const {
  registerUser,
  registerClient,
  getUserByFirebaseUid,
  updateLastLogin,
} = require('../../services/auth/auth.service');

/**
 * Auth Controllers
 * 
 * Controllers are THIN — they:
 * 1. Extract data from req
 * 2. Call the service
 * 3. Send the response
 * 
 * They do NOT contain business logic.
 * 
 * Note: req.user is populated by protect middleware (auth.middleware.js)
 * It contains the full MongoDB user document.
 * req.firebaseUser contains the raw decoded Firebase token.
 */

/**
 * POST /api/v1/auth/register/user
 * Called after Firebase signup — creates MongoDB profile with role=user
 */
const registerUserController = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  const user = await registerUser({
    firebaseUid: req.firebaseUser.uid,     // from verifyFirebaseToken middleware
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
 * Creates MongoDB profile with role=client
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
 * GET /api/v1/auth/me
 * Returns the logged-in user's profile
 * Used on app load to restore session
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is already populated by protect middleware
  // Just update last login and return
  await updateLastLogin(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user }, 'Profile fetched'));
});

module.exports = {
  registerUserController,
  registerClientController,
  getMe,
};