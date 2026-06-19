const router = require('express').Router();
const { protect } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { addBookmarkSchema, updateBookmarkSchema } = require('../../validations/bookmarks/bookmark.validation');
const {
  addBookmarkController,
  getBookmarksController,
  getTagsController,
  checkBookmarkController,
  updateBookmarkController,
  removeBookmarkController,
} = require('../../controllers/bookmarks/bookmark.controller');

// All bookmark routes — client only
router.use(protect, authorizeRoles('client'));

router.post('/',                validate(addBookmarkSchema),    addBookmarkController);
router.get('/',                                                 getBookmarksController);
router.get('/tags',                                             getTagsController);
router.get('/check/:profileId',                                 checkBookmarkController);
router.patch('/:id',            validate(updateBookmarkSchema), updateBookmarkController);
router.delete('/:profileId',                                    removeBookmarkController);

module.exports = router;