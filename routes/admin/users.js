const express = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { authMiddleware, adminMiddleware } = require('../../middleware/auth');
const { updateUserRole } = require('../../controllers/admin/userController');

const router = express.Router();

// All admin user routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// PATCH /api/admin/users/:id/role — Promote or demote a user
router.patch(
  '/:id/role',
  [
    body('role')
      .notEmpty()
      .withMessage('Role is required.')
      .isIn(['USER', 'ADMIN'])
      .withMessage("Role must be 'USER' or 'ADMIN'."),
  ],
  validate,
  updateUserRole
);

module.exports = router;
