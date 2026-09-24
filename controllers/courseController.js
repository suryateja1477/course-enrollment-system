const Course = require('../models/Course');

/**
 * GET /api/courses
 * List all active courses with availability info. Public access.
 */
const listCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ status: 'active' }).sort({ createdAt: -1 });
    res.status(200).json({ count: courses.length, courses });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/courses/:id
 * View a single course's details. Public access.
 */
const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    res.status(200).json({ course });
  } catch (error) {
    next(error);
  }
};

module.exports = { listCourses, getCourse };
