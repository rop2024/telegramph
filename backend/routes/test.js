const express = require('express');
const Test = require('../models/Test');
const router = express.Router();

// Test MongoDB connection by saving a document
router.post('/test-db', async (req, res) => {
  try {
    const testDoc = new Test({ message: 'MongoDB connection test successful!' });
    await testDoc.save();
    res.json({ 
      success: true, 
      message: 'MongoDB connection working!',
      data: testDoc 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'MongoDB connection failed',
      error: error.message 
    });
  }
});

// Get all test documents
router.get('/test-db', async (req, res) => {
  try {
    const tests = await Test.find().sort({ timestamp: -1 });
    res.json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;