const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const {
  createCompany,
  getMyCompany,
  getCompanyBySlug,
  updateCompany,
  uploadCompanyLogo,
  getAllCompanies,
  verifyCompany,
  rejectCompany,
} = require('../../services/company/company.service');

// ── Client routes ─────────────────────────────────────────────────

// POST /api/v1/company
const createCompanyController = asyncHandler(async (req, res) => {
  const company = await createCompany(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, { company }, 'Company profile created'));
});

// GET /api/v1/company/me
const getMyCompanyController = asyncHandler(async (req, res) => {
  const company = await getMyCompany(req.user._id);
  return res.status(200).json(new ApiResponse(200, { company }, 'Company profile fetched'));
});

// GET /api/v1/company/:slug
const getCompanyController = asyncHandler(async (req, res) => {
  const company = await getCompanyBySlug(req.params.slug);
  return res.status(200).json(new ApiResponse(200, { company }, 'Company fetched'));
});

// PATCH /api/v1/company/me
const updateCompanyController = asyncHandler(async (req, res) => {
  const company = await updateCompany(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, { company }, 'Company updated'));
});

// POST /api/v1/company/me/logo
const uploadLogoController = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image file provided');
  const result = await uploadCompanyLogo(req.user._id, req.file.buffer);
  return res.status(200).json(new ApiResponse(200, result, 'Logo uploaded'));
});

// ── Admin routes ──────────────────────────────────────────────────

// GET /api/v1/company/admin/all
const getAllCompaniesController = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await getAllCompanies({ status, page: +page, limit: +limit });
  return res.status(200).json(new ApiResponse(200, result, 'Companies fetched'));
});

// PATCH /api/v1/company/admin/:id/verify
const verifyCompanyController = asyncHandler(async (req, res) => {
  const company = await verifyCompany(req.params.id, req.user._id);
  return res.status(200).json(new ApiResponse(200, { company }, 'Company verified successfully'));
});

// PATCH /api/v1/company/admin/:id/reject
const rejectCompanyController = asyncHandler(async (req, res) => {
  const company = await rejectCompany(req.params.id, req.user._id, req.body.rejectionReason);
  return res.status(200).json(new ApiResponse(200, { company }, 'Company rejected'));
});

module.exports = {
  createCompanyController,
  getMyCompanyController,
  getCompanyController,
  updateCompanyController,
  uploadLogoController,
  getAllCompaniesController,
  verifyCompanyController,
  rejectCompanyController,
};