// modules/hire/hire.routes.js
//
// ⚠️ ASSUMPTION: your auth middleware is at
// '../../middlewares/auth.middleware' and exports a function directly
// (e.g. module.exports = protect). If yours exports a named object
// instead (e.g. module.exports = { protect }), change the import line
// below to:  const { protect } = require('../../middlewares/auth.middleware');
// and use `protect` in place of `auth`.

const router = require('express').Router();


// to this (matching whatever the real export name is):
const { protect: auth } = require("../../middlewares/auth.middleware");

const {
  createHireRequest,
  acceptHireRequest,
  rejectHireRequest,
  cancelHireRequest,
  getIncomingRequests,
  getSentRequests,
  getHireRequestById,
} = require("../../controllers/hire/hire.controller");

// Every hire route requires a logged-in user.
router.use(auth);

router.get('/incoming', getIncomingRequests);
router.get('/sent', getSentRequests);
router.get('/:id', getHireRequestById);

router.post('/:profileId', createHireRequest);

router.patch('/:id/accept', acceptHireRequest);
router.patch('/:id/reject', rejectHireRequest);
router.patch('/:id/cancel', cancelHireRequest);

module.exports = router;