const Company = require('../../models/company/company.model');
const User = require('../../models/auth/auth.model');
const ApiError = require('../../utils/ApiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../middlewares/upload.middleware');

/**
 * Company Service
 *
 * Key business rule:
 * A client can ONLY see user contact details
 * if their company is VERIFIED by admin.
 */

const createCompany = async (clientId, data) => {
  const existing = await Company.findOne({ client: clientId });
  if (existing) throw new ApiError(409, 'Company profile already exists. Use update instead.');

  const company = await Company.create({ client: clientId, ...data });
  return company;
};

const getMyCompany = async (clientId) => {
  const company = await Company.findOne({ client: clientId });
  if (!company) throw new ApiError(404, 'No company profile found. Please create one.');
  return company;
};

const getCompanyBySlug = async (slug) => {
  const company = await Company.findOne({ slug, isActive: true })
    .populate('client', 'name email');
  if (!company) throw new ApiError(404, 'Company not found');
  return company;
};

const updateCompany = async (clientId, data) => {
  const company = await Company.findOne({ client: clientId });
  if (!company) throw new ApiError(404, 'Company profile not found');

  // If name changed, reset slug so pre-save hook regenerates it
  if (data.name && data.name !== company.name) {
    company.slug = undefined;
  }

  Object.assign(company, data);
  await company.save();
  return company;
};

const uploadCompanyLogo = async (clientId, fileBuffer) => {
  const company = await Company.findOne({ client: clientId });
  if (!company) throw new ApiError(404, 'Company not found. Create your company profile first.');

  // Delete old logo
  if (company.logo?.publicId) {
    await deleteFromCloudinary(company.logo.publicId);
  }

  const { url, publicId } = await uploadToCloudinary(
    fileBuffer,
    'hireme/company-logos',
    {
      transformation: [
        { width: 300, height: 300, crop: 'fit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    }
  );

  company.logo = { url, publicId };
  await company.save();

  return { url };
};

// ── Admin actions ─────────────────────────────────────────────────

const getAllCompanies = async ({ status, page = 1, limit = 20 } = {}) => {
  const filter = status ? { verificationStatus: status } : {};
  const skip = (page - 1) * limit;

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .populate('client', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Company.countDocuments(filter),
  ]);

  return {
    companies,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

const verifyCompany = async (companyId, adminId) => {
  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, 'Company not found');
  if (company.verificationStatus === 'verified') {
    throw new ApiError(400, 'Company is already verified');
  }

  company.verificationStatus = 'verified';
  company.verifiedAt = new Date();
  company.verifiedBy = adminId;
  company.rejectionReason = undefined;
  await company.save();

  return company;
};

const rejectCompany = async (companyId, adminId, rejectionReason) => {
  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  company.verificationStatus = 'rejected';
  company.rejectionReason = rejectionReason;
  company.verifiedBy = adminId;
  await company.save();

  return company;
};

/**
 * isClientVerified
 * Used by other services (profile) to check if a client
 * can access user contact details.
 */
const isClientVerified = async (clientId) => {
  const company = await Company.findOne({ client: clientId });
  return company?.verificationStatus === 'verified';
};

module.exports = {
  createCompany,
  getMyCompany,
  getCompanyBySlug,
  updateCompany,
  uploadCompanyLogo,
  getAllCompanies,
  verifyCompany,
  rejectCompany,
  isClientVerified,
};