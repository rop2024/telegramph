const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// @route   GET /api/protected/test
// @desc    Test protected route
// @access  Private
router.get('/test', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: '✅ Access granted to protected route!',
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    },
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/protected/admin-test
// @desc    Test admin-only route
// @access  Private (Admin only)
router.get('/admin-test', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }

  res.json({
    success: true,
    message: '✅ Welcome, Admin!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;