const Course = require('../../models/Course');
const Enrollment = require('../../models/Enrollment');

/**
 * POST /api/admin/courses
 * Create a new course.
 */
const createCourse = async (req, res, next) => {
  try {
    const { name, description, instructor, capacity, allowDrops, allowReEnrollment } = req.body;

    const course = await Course.create({
      name,
      description,
      instructor,
      capacity,
      allowDrops,
      allowReEnrollment,
    });

    res.status(201).json({ message: 'Course created successfully.', course });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/courses/:id
 * Update course details. Capacity cannot be reduced below current enrolledCount.
 */
const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const { name, description, instructor, capacity, allowDrops, allowReEnrollment } = req.body;

    // Business rule: capacity cannot be reduced below enrolledCount
    if (capacity !== undefined && capacity < course.enrolledCount) {
      return res.status(400).json({
        error: `Cannot reduce capacity below the current enrolled count (${course.enrolledCount}).`,
      });
    }

    // Apply updates (only fields that are provided)
    if (name !== undefined) course.name = name;
    if (description !== undefined) course.description = description;
    if (instructor !== undefined) course.instructor = instructor;
    if (capacity !== undefined) course.capacity = capacity;
    if (allowDrops !== undefined) course.allowDrops = allowDrops;
    if (allowReEnrollment !== undefined) course.allowReEnrollment = allowReEnrollment;

    await course.save();

    res.status(200).json({ message: 'Course updated successfully.', course });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/courses/:id/deactivate
 * Deactivate a course. Blocked if active enrollments exist.
 */
const deactivateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    if (course.status === 'inactive') {
      return res.status(400).json({ error: 'This course is already inactive.' });
    }

    // Check for active enrollments
    const activeEnrollments = await Enrollment.countDocuments({
      course: course._id,
      status: 'enrolled',
    });

    if (activeEnrollments > 0) {
      return res.status(400).json({
        error: `Cannot deactivate: ${activeEnrollments} active enrollment(s) exist. Handle them before deactivating.`,
      });
    }

    course.status = 'inactive';
    await course.save();

    res.status(200).json({ message: 'Course deactivated successfully.', course });
  } catch (error) {
    next(error);
  }
};

module.exports = { createCourse, updateCourse, deactivateCourse };
