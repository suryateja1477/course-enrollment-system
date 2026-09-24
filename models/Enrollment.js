const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    status: {
      type: String,
      enum: ['enrolled', 'dropped'],
      default: 'enrolled',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    droppedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Partial unique index: only one active enrollment per user per course.
// Dropped records are excluded so re-enrollment (when allowed) can create a new record.
enrollmentSchema.index(
  { user: 1, course: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'enrolled' },
  }
);

module.exports = mongoose.model('Enrollment', enrollmentSchema);
