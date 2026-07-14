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

/**
 * backfillProfileCategories
 *
 * One-off maintenance job. Before the fix in profile.controller.js
 * (updateSkillsController), saving skills never set profile.category —
 * so any profile built that way is stuck with category: null and never
 * shows up under /category/:slug, even though it matches on skill/text
 * search (see the Zagasoft example).
 *
 * This walks every profile still stuck at category: null, and derives
 * the category the same way the controller fix does now: find the
 * Category whose `skills` array has the most names in common with the
 * profile's own skills, and assign it.
 *
 * Safe to re-run any time — it only ever touches profiles that still
 * have category: null, so profiles fixed by a normal skills-save (or a
 * previous run of this job) are left alone.
 */
const backfillProfileCategories = async () => {
  const Profile = require('../../models/profiles/profile.model');

  const profiles = await Profile.find({
    category: null,
    'skills.0': { $exists: true }, // only profiles that actually have skills to match against
  });

  let updated = 0;
  let skipped = 0;
  const touchedCategoryIds = new Set();

  for (const profile of profiles) {
    const skillNames = profile.skills.map((s) => s.name).filter(Boolean);
    if (skillNames.length === 0) {
      skipped++;
      continue;
    }

    const matches = await Category.aggregate([
      { $match: { skills: { $in: skillNames }, isActive: true } },
      { $project: { matchCount: { $size: { $setIntersection: ['$skills', skillNames] } } } },
      { $sort: { matchCount: -1 } },
      { $limit: 1 },
    ]);

    if (matches[0]) {
      profile.category = matches[0]._id;
      await profile.save();
      touchedCategoryIds.add(matches[0]._id.toString());
      updated++;
    } else {
      // No skill name matched any Category.skills list — likely a
      // free-text fallback entry (SkillsSection falls back to a plain
      // text input if categories fail to load). Left as-is on purpose;
      // nothing to safely infer here.
      skipped++;
    }
  }

  // Recalculate profileCount only for categories that actually gained profiles
  for (const categoryId of touchedCategoryIds) {
    await refreshProfileCount(categoryId);
  }

  return {
    totalChecked: profiles.length,
    updated,
    skipped,
    categoriesRecounted: touchedCategoryIds.size,
  };
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  refreshProfileCount,
  backfillProfileCategories,
};