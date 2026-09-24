const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const { register, login, logout, getMe } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters.'),
    body('displayName')
      .trim()
      .notEmpty()
      .withMessage('Display name is required.'),
  ],
  validate,
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  login
);

// POST /api/auth/logout
router.post('/logout', authMiddleware, logout);

// GET /api/auth/me
router.get('/me', authMiddleware, getMe);

module.exports = router;
