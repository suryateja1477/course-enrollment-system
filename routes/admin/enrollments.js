const express = require('express');
const { authMiddleware, adminMiddleware } = require('../../middleware/auth');
const { getCourseEnrollments } = require('../../controllers/admin/enrollmentController');

const router = express.Router();

// All admin enrollment routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/courses/:id/enrollments — List enrollments for a course
router.get('/courses/:id/enrollments', getCourseEnrollments);

module.exports = router;
