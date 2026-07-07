// modules/hire/hire.controller.js
//
// ⚠️ THIS FILE MAKES 3 ASSUMPTIONS ABOUT YOUR EXISTING CODEBASE —
// check these against your real files and fix if they don't match:
//
//   1. Profile model path + field name for the linked user.
//      Assumed:  require('../profiles/profile.model')  with  profile.userId
//
//   2. Notification model path + schema shape.
//      Assumed:  require('../notifications/notification.model')
//      with fields: { recipient, type, message, relatedId, relatedModel }
//
//   3. Shared utils.
//      Assumed:  require('../../utils/ApiError')       — class ApiError(status, message)
//      Assumed:  require('../../utils/asyncHandler')   — wraps (req,res,next) => {}
//
// If any of these don't match your project, tell me the real path/shape
// and I'll regenerate this file with the correct ones — don't hand-edit
// blind, since a wrong field name here fails silently at runtime (a
// Notification.create() with a wrong field name won't throw, it'll just
// save undefined into that field).

const HireRequest = require("../../models/hire/hire.model");
const Profile = require("../../models/profiles/profile.model");
const Notification = require("../../models/notifications/notification.model");
// ⚠️ ASSUMPTION: Company model path, matching the same convention as the
// others above. If your Company model actually lives somewhere else,
// change this one require and nothing else in this file needs to change.
const Company = require("../../models/company/company.model");
const ApiError = require("../../utils/ApiError");
const asyncHandler = require("../../utils/asyncHandler");

// POST /api/v1/hire/:profileId
// Client sends a hire request to the freelancer behind this profile.
exports.createHireRequest = asyncHandler(async (req, res) => {
  const { profileId } = req.params;
  const { message } = req.body;
  const clientId = req.user._id;

  const profile = await Profile.findById(profileId);
  if (!profile) throw new ApiError(404, "Profile not found");

  const freelancerId = profile.user;

  if (String(freelancerId) === String(clientId)) {
    throw new ApiError(400, "You can't send a hire request to yourself");
  }

  let hireRequest;
  try {
    hireRequest = await HireRequest.create({
      client: clientId,
      freelancer: freelancerId,
      profile: profileId,
      message,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(
        409,
        "You already have a pending request with this freelancer",
      );
    }
    throw err;
  }
  // in createHireRequest
  // in createHireRequest
  await Notification.create({
    recipient: freelancerId,
    type: "hire_request",
    title: "New hire request",
    message: `${req.user.fullName || "A client"} wants to hire you.`,
    refId: hireRequest._id,
    refModel: "HireRequest",
  });

  res.status(201).json({
    success: true,
    message: "Hire request sent",
    data: { hireRequest },
  });
});

// PATCH /api/v1/hire/:id/accept
// Freelancer accepts an incoming hire request.
exports.acceptHireRequest = asyncHandler(async (req, res) => {
  const hireRequest = await HireRequest.findById(req.params.id);
  if (!hireRequest) throw new ApiError(404, "Hire request not found");

  if (String(hireRequest.freelancer) !== String(req.user._id)) {
    throw new ApiError(403, "Not authorized to respond to this request");
  }
  if (hireRequest.status !== "pending") {
    throw new ApiError(400, `This request was already ${hireRequest.status}`);
  }

  hireRequest.status = "accepted";
  hireRequest.respondedAt = new Date();
  await hireRequest.save();

  // in acceptHireRequest
  await Notification.create({
    recipient: hireRequest.client,
    type: "hire_accepted",
    title: "Hire request accepted",
    message: `${req.user.fullName || "The freelancer"} accepted your hire request.`,
    refId: hireRequest._id,
    refModel: "HireRequest",
  });

  res.json({
    success: true,
    message: "Hire request accepted",
    data: { hireRequest },
  });
});

// PATCH /api/v1/hire/:id/reject
// Freelancer rejects an incoming hire request.
exports.rejectHireRequest = asyncHandler(async (req, res) => {
  const hireRequest = await HireRequest.findById(req.params.id);
  if (!hireRequest) throw new ApiError(404, "Hire request not found");

  if (String(hireRequest.freelancer) !== String(req.user._id)) {
    throw new ApiError(403, "Not authorized to respond to this request");
  }
  if (hireRequest.status !== "pending") {
    throw new ApiError(400, `This request was already ${hireRequest.status}`);
  }

  hireRequest.status = "rejected";
  hireRequest.respondedAt = new Date();
  await hireRequest.save();

  // in rejectHireRequest
  await Notification.create({
    recipient: hireRequest.client,
    type: "hire_rejected",
    title: "Hire request declined",
    message: `${req.user.fullName || "The freelancer"} declined your hire request.`,
    refId: hireRequest._id,
    refModel: "HireRequest",
  });

  res.json({
    success: true,
    message: "Hire request rejected",
    data: { hireRequest },
  });
});

// PATCH /api/v1/hire/:id/cancel
// Client cancels a hire request they sent, while it's still pending.
exports.cancelHireRequest = asyncHandler(async (req, res) => {
  const hireRequest = await HireRequest.findById(req.params.id);
  if (!hireRequest) throw new ApiError(404, "Hire request not found");

  if (String(hireRequest.client) !== String(req.user._id)) {
    throw new ApiError(403, "Not authorized to cancel this request");
  }
  if (hireRequest.status !== "pending") {
    throw new ApiError(400, `This request was already ${hireRequest.status}`);
  }

  hireRequest.status = "cancelled";
  hireRequest.respondedAt = new Date();
  await hireRequest.save();

  res.json({
    success: true,
    message: "Hire request cancelled",
    data: { hireRequest },
  });
});

// GET /api/v1/hire/incoming
// Freelancer's inbox — hire requests sent TO them.
//
// Also attaches `client.companyName` for each request, so the freelancer's
// own profile page can show "Currently working with X" for accepted
// requests. Company is a separate collection keyed by `client` (a User id),
// not embedded on User itself, so this can't be done with a single
// populate() chain — we do a second query and merge in memory instead.
exports.getIncomingRequests = asyncHandler(async (req, res) => {
  const requests = await HireRequest.find({ freelancer: req.user._id })
    .sort("-createdAt")
    .populate("client", "fullName profileImage")
    .populate("profile", "fullName category")
    .lean();

  const clientIds = [
    ...new Set(requests.map((r) => r.client?._id && String(r.client._id)).filter(Boolean)),
  ];

  const companies = clientIds.length
    ? await Company.find({ client: { $in: clientIds } }).select("name client").lean()
    : [];

  const companyNameByClientId = new Map(
    companies.map((c) => [String(c.client), c.name])
  );

  const requestsWithCompany = requests.map((r) => ({
    ...r,
    client: r.client
      ? { ...r.client, companyName: companyNameByClientId.get(String(r.client._id)) || null }
      : r.client,
  }));

  res.json({ success: true, data: { requests: requestsWithCompany } });
});

// GET /api/v1/hire/sent
// Client's outbox — hire requests they've sent, with current status.
exports.getSentRequests = asyncHandler(async (req, res) => {
  const requests = await HireRequest.find({ client: req.user._id })
    .sort("-createdAt")
    .populate("freelancer", "fullName profileImage")
    .populate("profile", "fullName category");

  res.json({ success: true, data: { requests } });
});

// GET /api/v1/hire/:id
// Single hire request detail (either party can view their own).
exports.getHireRequestById = asyncHandler(async (req, res) => {
  const hireRequest = await HireRequest.findById(req.params.id)
    .populate("client", "fullName profileImage")
    .populate("freelancer", "fullName profileImage")
    .populate("profile", "fullName category");

  if (!hireRequest) throw new ApiError(404, "Hire request not found");

  const isParty =
    String(hireRequest.client._id) === String(req.user._id) ||
    String(hireRequest.freelancer._id) === String(req.user._id);

  if (!isParty) throw new ApiError(403, "Not authorized to view this request");

  res.json({ success: true, data: { hireRequest } });
});