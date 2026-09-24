const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const { enroll, getMyEnrollments, dropEnrollment } = require('../controllers/enrollmentController');

const router = express.Router();

// All enrollment routes require authentication
router.use(authMiddleware);

// POST /api/enrollments — Enroll in a course
router.post(
  '/',
  [
    body('courseId')
      .notEmpty()
      .withMessage('Course ID is required.')
      .isMongoId()
      .withMessage('Invalid course ID format.'),
  ],
  validate,
  enroll
);

// GET /api/enrollments/my — List own enrollments
router.get('/my', getMyEnrollments);

// PATCH /api/enrollments/:id/drop — Drop an enrollment
router.patch('/:id/drop', dropEnrollment);

module.exports = router;
