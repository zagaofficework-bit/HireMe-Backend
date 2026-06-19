const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const {
  addBookmark,
  getMyBookmarks,
  getMyTags,
  updateBookmark,
  removeBookmark,
  isBookmarked,
} = require("../../services/bookmarks/bookmark.service");

const addBookmarkController = asyncHandler(async (req, res) => {
  const bookmark = await addBookmark(req.user._id, req.body, req.user.name);
  return res
    .status(201)
    .json(new ApiResponse(201, { bookmark }, "Profile bookmarked"));
});

const getBookmarksController = asyncHandler(async (req, res) => {
  const { tag, page, limit } = req.query;
  const result = await getMyBookmarks(req.user._id, { tag, page, limit });
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Bookmarks fetched"));
});

const getTagsController = asyncHandler(async (req, res) => {
  const tags = await getMyTags(req.user._id);
  return res.status(200).json(new ApiResponse(200, { tags }, "Tags fetched"));
});

const checkBookmarkController = asyncHandler(async (req, res) => {
  const bookmarked = await isBookmarked(req.user._id, req.params.profileId);
  return res
    .status(200)
    .json(new ApiResponse(200, { bookmarked }, "Bookmark status checked"));
});

const updateBookmarkController = asyncHandler(async (req, res) => {
  const bookmark = await updateBookmark(req.user._id, req.params.id, req.body);
  return res
    .status(200)
    .json(new ApiResponse(200, { bookmark }, "Bookmark updated"));
});

const removeBookmarkController = asyncHandler(async (req, res) => {
  await removeBookmark(req.user._id, req.params.profileId);
  return res.status(200).json(new ApiResponse(200, {}, "Bookmark removed"));
});

module.exports = {
  addBookmarkController,
  getBookmarksController,
  getTagsController,
  checkBookmarkController,
  updateBookmarkController,
  removeBookmarkController,
};
