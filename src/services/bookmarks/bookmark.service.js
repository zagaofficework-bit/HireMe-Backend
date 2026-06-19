const Bookmark = require("../../models/bookmarks/bookmark.model");
const Profile = require("../../models/profiles/profile.model");
const ApiError = require("../../utils/ApiError");
const { trackEvent } = require("../analytics/analytics.service");
const { createNotification } = require("../notifications/notification.service");

const addBookmark = async (
  clientId,
  { profileId, tag, note },
  clientName = "A client",
) => {
  const profile = await Profile.findOne({ _id: profileId, isVisible: true });
  if (!profile) throw new ApiError(404, "Profile not found");

  const existing = await Bookmark.findOne({
    client: clientId,
    profile: profileId,
  });
  if (existing) throw new ApiError(409, "Profile already bookmarked");

  const bookmark = await Bookmark.create({
    client: clientId,
    profile: profileId,
    tag: tag || null,
    note: note || null,
  });

  await trackEvent({
    event: "bookmark_add",
    actorId: clientId,
    actorRole: "client",
    targetId: profile.user,
  });

  // Notify the user their profile was shortlisted
  await createNotification({
    recipientId: profile.user,
    type: "profile_shortlisted",
    templateArgs: [clientName],
    refModel: "Profile",
    refId: profileId,
  });

  return bookmark;
};

const getMyBookmarks = async (clientId, { tag, page = 1, limit = 20 } = {}) => {
  const filter = { client: clientId };
  if (tag) filter.tag = tag;
  const skip = (page - 1) * limit;

  const [bookmarks, total] = await Promise.all([
    Bookmark.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(+limit)
      .populate({
        path: "profile",
        select:
          "fullName profileImage skills bio location workType availability averageRating isVerified",
        populate: { path: "category", select: "name slug icon" },
      })
      .lean(),
    Bookmark.countDocuments(filter),
  ]);

  return {
    bookmarks,
    pagination: {
      total,
      page: +page,
      limit: +limit,
      pages: Math.ceil(total / +limit),
    },
  };
};

const getMyTags = async (clientId) => {
  return await Bookmark.distinct("tag", {
    client: clientId,
    tag: { $ne: null },
  });
};

const updateBookmark = async (clientId, bookmarkId, { tag, note }) => {
  const bookmark = await Bookmark.findOne({
    _id: bookmarkId,
    client: clientId,
  });
  if (!bookmark) throw new ApiError(404, "Bookmark not found");
  if (tag !== undefined) bookmark.tag = tag;
  if (note !== undefined) bookmark.note = note;
  await bookmark.save();
  return bookmark;
};

const removeBookmark = async (clientId, profileId) => {
  const bookmark = await Bookmark.findOneAndDelete({
    client: clientId,
    profile: profileId,
  });
  if (!bookmark) throw new ApiError(404, "Bookmark not found");
};

const isBookmarked = async (clientId, profileId) => {
  const bookmark = await Bookmark.findOne({
    client: clientId,
    profile: profileId,
  });
  return !!bookmark;
};

module.exports = {
  addBookmark,
  getMyBookmarks,
  getMyTags,
  updateBookmark,
  removeBookmark,
  isBookmarked,
};
