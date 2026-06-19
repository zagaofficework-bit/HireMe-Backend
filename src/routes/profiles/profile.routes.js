const router = require('express').Router();
const { protect, optionalAuth } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createProfileSchema,
  updateBasicSchema,
  updateSkillsSchema,
  updateExperienceSchema,
  updateEducationSchema,
  updatePreferencesSchema,
  updateLocationSchema,
  updateSocialSchema,
  updateContactSchema,
  updateLanguagesSchema,
} = require('../../validations/profiles/profile.validation');
const {
  createProfileController,
  getMyProfileController,
  getPublicProfileController,
  updateBasicController,
  updateSkillsController,
  updateExperienceController,
  updateEducationController,
  updatePreferencesController,
  updateLocationController,
  updateSocialController,
  updateContactController,
  updateLanguagesController,
  toggleVisibilityController,
  deleteProfileController,
} = require('../../controllers/profiles/profile.controller');

// ── Own profile (user only) ───────────────────────────────────────
router.post('/',              protect, authorizeRoles('user'), validate(createProfileSchema),    createProfileController);
router.get('/me',             protect,                                                           getMyProfileController);
router.patch('/me/basic',     protect, authorizeRoles('user'), validate(updateBasicSchema),      updateBasicController);
router.patch('/me/skills',    protect, authorizeRoles('user'), validate(updateSkillsSchema),     updateSkillsController);
router.patch('/me/experience',protect, authorizeRoles('user'), validate(updateExperienceSchema), updateExperienceController);
router.patch('/me/education', protect, authorizeRoles('user'), validate(updateEducationSchema),  updateEducationController);
router.patch('/me/preferences',protect,authorizeRoles('user'), validate(updatePreferencesSchema),updatePreferencesController);
router.patch('/me/location',  protect, authorizeRoles('user'), validate(updateLocationSchema),   updateLocationController);
router.patch('/me/social',    protect, authorizeRoles('user'), validate(updateSocialSchema),     updateSocialController);
router.patch('/me/contact',   protect, authorizeRoles('user'), validate(updateContactSchema),    updateContactController);
router.patch('/me/languages', protect, authorizeRoles('user'), validate(updateLanguagesSchema),  updateLanguagesController);
router.patch('/me/visibility',protect, authorizeRoles('user'),                                   toggleVisibilityController);
router.delete('/me',          protect, authorizeRoles('user'),                                   deleteProfileController);

// ── Public profile view (optionalAuth — guests see less) ──────────
// IMPORTANT: this must be AFTER /me routes or ':id' will catch 'me'
router.get('/:id', optionalAuth, getPublicProfileController);

module.exports = router;