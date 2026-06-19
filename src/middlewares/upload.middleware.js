const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

/**
 * Upload Middleware
 *
 * Flow:
 *  1. Multer receives the file from the request (stores in memory, not disk)
 *  2. We manually upload buffer to Cloudinary
 *  3. Cloudinary returns a URL + public_id
 *  4. Controller saves URL to the profile
 *
 * Why memory storage?
 *  In production (Render/Hostinger) the filesystem is ephemeral —
 *  files saved to disk disappear on restart. Memory → Cloudinary is safer.
 */

// Store file in memory as a Buffer (not on disk)
const storage = multer.memoryStorage();

// ── File type filters ─────────────────────────────────────────────

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only JPEG, PNG and WebP images are allowed'), false);
  }
};

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only PDF files are allowed for resume'), false);
  }
};

const imageOrPdfFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only images and PDFs are allowed'), false);
  }
};

// ── Multer instances ──────────────────────────────────────────────

// Profile image — max 2MB
const uploadProfileImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('profileImage');

// Resume — max 5MB PDF
const uploadResume = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('resume');

// Portfolio — up to 5 images at once
const uploadPortfolio = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
}).array('portfolio', 5);

// Company logo — max 2MB
const uploadCompanyLogo = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('logo');

// ── Cloudinary upload helper ──────────────────────────────────────

/**
 * uploadToCloudinary
 * Takes a file buffer and uploads it to Cloudinary.
 * Returns { url, publicId }
 *
 * @param {Buffer} buffer    - file data
 * @param {string} folder    - Cloudinary folder e.g. 'hireme/profiles'
 * @param {object} options   - extra Cloudinary options
 */
const uploadToCloudinary = (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // auto-detect image vs pdf
        ...options,
      },
      (error, result) => {
        if (error) return reject(new ApiError(500, 'Cloudinary upload failed: ' + error.message));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * deleteFromCloudinary
 * Deletes a file from Cloudinary using its public_id.
 * Called when user replaces their profile image or resume.
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    // Don't crash if deletion fails — just log it
    console.error('Cloudinary delete error:', err.message);
  }
};

/**
 * multerErrorHandler
 * Wraps multer middleware to convert multer errors into ApiErrors
 * so our global error handler can format them properly.
 */
const multerErrorHandler = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, 'File too large. Check size limits.'));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new ApiError(400, 'Too many files uploaded at once.'));
    }
    if (err instanceof ApiError) {
      return next(err);
    }
    return next(new ApiError(400, err.message || 'File upload error'));
  });
};

module.exports = {
  uploadProfileImage: multerErrorHandler(uploadProfileImage),
  uploadResume:       multerErrorHandler(uploadResume),
  uploadPortfolio:    multerErrorHandler(uploadPortfolio),
  uploadCompanyLogo:  multerErrorHandler(uploadCompanyLogo),
  uploadToCloudinary,
  deleteFromCloudinary,
};