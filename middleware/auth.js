const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * authMiddleware — Verifies the JWT from the HTTP-only cookie.
 * Attaches the authenticated user to req.user.
 * Returns 401 if the token is missing, invalid, or the user no longer exists.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token. Please sign in again.' });
    }
    next(error);
  }
};

/**
 * adminMiddleware — Must be used AFTER authMiddleware.
 * Checks that the authenticated user has the ADMIN role.
 * Returns 403 if the user is not an admin.
 */
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
