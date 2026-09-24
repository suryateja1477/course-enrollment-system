const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate a JWT for the given user and set it as an HTTP-only cookie.
 */
const sendTokenCookie = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(statusCode).json({ message: 'Success', user });
};

/**
 * POST /api/auth/register
 * Register a new user. The ADMIN_EMAIL env var controls bootstrap admin assignment.
 */
const register = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Determine role: bootstrap admin check
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const role = adminEmail && email.toLowerCase().trim() === adminEmail ? 'ADMIN' : 'USER';

    const user = await User.create({ email, password, displayName, role });

    sendTokenCookie(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Sign in with email and password.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select the password field (excluded by toJSON)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    sendTokenCookie(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Clear the JWT cookie.
 */
const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully.' });
};

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 */
const getMe = (req, res) => {
  res.status(200).json({ user: req.user });
};

module.exports = { register, login, logout, getMe };
