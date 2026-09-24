const Enrollment = require('../../models/Enrollment');
const Course = require('../../models/Course');

/**
 * GET /api/admin/courses/:id/enrollments
 * List all enrollments for a specific course. Admin read-only access.
 */
const getCourseEnrollments = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const enrollments = await Enrollment.find({ course: req.params.id })
      .populate('user', 'email displayName role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      course: { _id: course._id, name: course.name },
      count: enrollments.length,
      enrollments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCourseEnrollments };
