const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Placeholder routes - will be implemented in Phase 3
router.get('/', protect, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get all receivers endpoint - to be implemented'
  });
});

router.post('/', protect, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Create receiver endpoint - to be implemented'
  });
});

router.put('/:id', protect, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Update receiver endpoint - to be implemented'
  });
});

router.delete('/:id', protect, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Delete receiver endpoint - to be implemented'
  });
});

module.exports = router;