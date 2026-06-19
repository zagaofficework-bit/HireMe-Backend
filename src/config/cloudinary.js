const cloudinary = require('cloudinary').v2;

/**
 * Cloudinary Configuration
 * 
 * Cloudinary is a cloud service that stores images/files.
 * We use it instead of storing files on our server because:
 *  - Our server storage is limited
 *  - Cloudinary gives us a CDN (fast global delivery)
 *  - Files persist even if server restarts
 * 
 * Get credentials from: cloudinary.com → Dashboard
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;