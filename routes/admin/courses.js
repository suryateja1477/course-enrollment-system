const express = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { authMiddleware, adminMiddleware } = require('../../middleware/auth');
const { createCourse, updateCourse, deactivateCourse } = require('../../controllers/admin/courseController');

const router = express.Router();

// All admin course routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// POST /api/admin/courses — Create a course
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Course name is required.'),
    body('description').trim().notEmpty().withMessage('Course description is required.'),
    body('instructor').trim().notEmpty().withMessage('Instructor name is required.'),
    body('capacity')
      .isInt({ min: 1 })
      .withMessage('Capacity must be a positive integer.'),
    body('allowDrops').optional().isBoolean().withMessage('allowDrops must be a boolean.'),
    body('allowReEnrollment').optional().isBoolean().withMessage('allowReEnrollment must be a boolean.'),
  ],
  validate,
  createCourse
);

// PUT /api/admin/courses/:id — Update a course
router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Course name cannot be empty.'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty.'),
    body('instructor').optional().trim().notEmpty().withMessage('Instructor cannot be empty.'),
    body('capacity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Capacity must be a positive integer.'),
    body('allowDrops').optional().isBoolean().withMessage('allowDrops must be a boolean.'),
    body('allowReEnrollment').optional().isBoolean().withMessage('allowReEnrollment must be a boolean.'),
  ],
  validate,
  updateCourse
);

// PATCH /api/admin/courses/:id/deactivate — Deactivate a course
router.patch('/:id/deactivate', deactivateCourse);

module.exports = router;
