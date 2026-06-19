const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const { getHomepageData } = require('../../services/profiles/homepage.service');

// GET /api/v1/homepage
// Public — no auth required
const getHomepage = asyncHandler(async (req, res) => {
  const data = await getHomepageData();
  return res.status(200).json(new ApiResponse(200, data, 'Homepage data fetched'));
});

module.exports = { getHomepage };