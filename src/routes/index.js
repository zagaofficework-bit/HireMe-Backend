const router = require("express").Router();
const {
  apiLimiter,
  authLimiter,
  browseLimiter,
  uploadLimiter,
} = require("../middlewares/rateLimiter.middleware");

router.use("/auth", authLimiter, require("./auth/auth.routes"));
router.use("/analytics", apiLimiter, require("./analytics/analytics.routes"));
router.use(
  "/categories",
  browseLimiter,
  require("./categories/category.routes"),
);
router.use("/homepage", browseLimiter, require("./profiles/homepage.routes"));
router.use("/profiles", apiLimiter, require("./profiles/profile.routes"));
// router.use('/uploads',    uploadLimiter, require('./uploads/upload.routes'));
router.use("/company", apiLimiter, require("./company/company.routes"));
router.use("/admin", apiLimiter, require("./admin/admin.routes"));
router.use("/search", browseLimiter, require("./search/search.routes"));
router.use(
  "/verification",
  apiLimiter,
  require("./verification/verification.routes"),
);
router.use("/reviews", apiLimiter, require("./reviews/reviews.routes"));
router.use("/bookmarks", apiLimiter, require("./bookmarks/bookmark.routes"));
router.use("/reports", apiLimiter, require("./reports/report.routes"));
router.use(
  "/notifications",
  browseLimiter,
  require("./notifications/notification.routes"),
);
router.use("/hire", apiLimiter, require("./hire/hire.routes"));

module.exports = router;
