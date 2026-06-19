const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
} = require('../../services/categories/category.service');

// Public — GET /api/v1/categories
const listCategories = asyncHandler(async (req, res) => {
  const categories = await getAllCategories();
  return res.status(200).json(new ApiResponse(200, { categories }, 'Categories fetched'));
});

// Public — GET /api/v1/categories/:slug
const getCategory = asyncHandler(async (req, res) => {
  const category = await getCategoryBySlug(req.params.slug);
  return res.status(200).json(new ApiResponse(200, { category }, 'Category fetched'));
});

// Admin — POST /api/v1/categories
const createCategoryController = asyncHandler(async (req, res) => {
  const category = await createCategory(req.body);
  return res.status(201).json(new ApiResponse(201, { category }, 'Category created'));
});

// Admin — PATCH /api/v1/categories/:id
const updateCategoryController = asyncHandler(async (req, res) => {
  const category = await updateCategory(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, { category }, 'Category updated'));
});

// Admin — DELETE /api/v1/categories/:id
const deleteCategoryController = asyncHandler(async (req, res) => {
  await deleteCategory(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, 'Category deleted'));
});

module.exports = {
  listCategories,
  getCategory,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
};