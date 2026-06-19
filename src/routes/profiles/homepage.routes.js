const router = require('express').Router();
const { getHomepage } = require('../../controllers/profiles/homepage.controller');

// GET /api/v1/homepage
router.get('/', getHomepage);

module.exports = router;