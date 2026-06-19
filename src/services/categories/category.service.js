const Category = require('../../models/categories/category.model');
const ApiError = require('../../utils/ApiError');

// Auto-generate slug from name e.g. "Web Development" → "web-development"
const generateSlug = (name) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const createCategory = async (data) => {
  const slug = data.slug || generateSlug(data.name);

  const exists = await Category.findOne({ $or: [{ name: data.name }, { slug }] });
  if (exists) throw new ApiError(409, 'Category with this name already exists');

  return await Category.create({ ...data, slug });
};

const getAllCategories = async ({ includeInactive = false } = {}) => {
  const filter = includeInactive ? {} : { isActive: true };
  return await Category.find(filter).sort({ isFeatured: -1, order: 1, name: 1 });
};

const getCategoryBySlug = async (slug) => {
  const category = await Category.findOne({ slug, isActive: true });
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
};

const updateCategory = async (id, data) => {
  const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
};

const deleteCategory = async (id) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
};

// Called after a profile is saved/updated to keep count accurate
const refreshProfileCount = async (categoryId) => {
  const Profile = require('../../models/profiles/profile.model');
  const count = await Profile.countDocuments({ category: categoryId, isVisible: true });
  await Category.findByIdAndUpdate(categoryId, { profileCount: count });
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  refreshProfileCount,
};