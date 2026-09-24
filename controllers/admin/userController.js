const User = require('../../models/User');

/**
 * PATCH /api/admin/users/:id/role
 * Promote or demote a user's role. Only accessible by admins.
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: "Role must be 'USER' or 'ADMIN'." });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role === role) {
      return res.status(400).json({ error: `User already has the '${role}' role.` });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: `User role updated to '${role}'.`, user });
  } catch (error) {
    next(error);
  }
};

module.exports = { updateUserRole };
