const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Placeholder routes - will be implemented in Phase 3
router.get('/', protect, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get all drafts endpoint - to be implemented'
  });
});

router.post('/', protect, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Create draft endpoint - to be implemented'
  });
});

router.get('/:id', protect, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get single draft endpoint - to be implemented'
  });
});

router.put('/:id', protect, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Update draft endpoint - to be implemented'
  });
});

router.delete('/:id', protect, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Delete draft endpoint - to be implemented'
  });
});

module.exports = router;