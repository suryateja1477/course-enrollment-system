const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

/**
 * POST /api/enrollments
 * Enroll the authenticated user in a course.
 * Enforces: course exists, course active, capacity available,
 * no duplicate active enrollment, and re-enrollment rules.
 */
const enroll = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    // 1. Find the course
    const course = await Course.findById(courseId).session(session);
    if (!course) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Course not found.' });
    }

    // 2. Check course is active
    if (course.status !== 'active') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'This course is not currently accepting enrollments.' });
    }

    // 3. Check capacity
    if (course.enrolledCount >= course.capacity) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'This course is full. No seats available.' });
    }

    // 4. Check for existing active enrollment
    const existingActive = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: 'enrolled',
    }).session(session);

    if (existingActive) {
      await session.abortTransaction();
      return res.status(409).json({ error: 'You are already enrolled in this course.' });
    }

    // 5. Check re-enrollment rules (if user previously dropped)
    const previousDrop = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: 'dropped',
    }).session(session);

    if (previousDrop && !course.allowReEnrollment) {
      await session.abortTransaction();
      return res.status(403).json({
        error: 'Re-enrollment is not allowed for this course after dropping.',
      });
    }

    // 6. Atomically increment enrolledCount (with capacity guard)
    const updatedCourse = await Course.findOneAndUpdate(
      { _id: courseId, enrolledCount: { $lt: course.capacity } },
      { $inc: { enrolledCount: 1 } },
      { new: true, session }
    );

    if (!updatedCourse) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'This course is full. No seats available.' });
    }

    // 7. Create the enrollment record
    const enrollment = await Enrollment.create(
      [{ user: userId, course: courseId, status: 'enrolled' }],
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      message: 'Enrolled successfully.',
      enrollment: enrollment[0],
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/enrollments/my
 * List all enrollments (enrolled + dropped history) for the authenticated user.
 */
const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate('course', 'name instructor status')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: enrollments.length, enrollments });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/enrollments/:id/drop
 * Drop an enrollment. Only the owning user can drop, and only if the course allows drops.
 * The enrollment record is preserved with status 'dropped' for history.
 */
const dropEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('course');

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Ownership check
    if (enrollment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only drop your own enrollments.' });
    }

    // Already dropped
    if (enrollment.status === 'dropped') {
      return res.status(400).json({ error: 'This enrollment has already been dropped.' });
    }

    // Check course drop policy
    if (!enrollment.course.allowDrops) {
      return res.status(403).json({ error: 'Dropping is not allowed for this course.' });
    }

    // Update enrollment status
    enrollment.status = 'dropped';
    enrollment.droppedAt = new Date();
    await enrollment.save();

    // Decrement enrolledCount atomically
    await Course.findByIdAndUpdate(enrollment.course._id, {
      $inc: { enrolledCount: -1 },
    });

    res.status(200).json({ message: 'Enrollment dropped successfully.', enrollment });
  } catch (error) {
    next(error);
  }
};

module.exports = { enroll, getMyEnrollments, dropEnrollment };
