// modules/hire/hire.model.js
const mongoose = require('mongoose');

const hireRequestSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
    respondedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// One PENDING request per client→freelancer pair at a time. Prevents a
// client spamming the same freelancer with duplicate hire requests while
// one is still awaiting a response. Once accepted/rejected/cancelled, a
// new request can be created again (the partial filter only counts
// 'pending' docs toward the unique constraint).
hireRequestSchema.index(
  { client: 1, freelancer: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

hireRequestSchema.index({ freelancer: 1, status: 1 });
hireRequestSchema.index({ client: 1, status: 1 });

module.exports = mongoose.model('HireRequest', hireRequestSchema);