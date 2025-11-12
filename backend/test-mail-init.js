// Quick test script to initialize and print email service status
require('dotenv').config();
const emailService = require('./utils/emailService');

// Wait for a short time for async init() to complete
const waitMs = 5000;
console.log(`Starting email service test (waiting ${waitMs}ms for init)...`);

setTimeout(() => {
  try {
    const status = emailService.getStatus();
    console.log('EMAIL SERVICE STATUS:', JSON.stringify(status, null, 2));
  } catch (err) {
    console.error('Error getting email service status:', err);
  }
  // Exit to end the script
  process.exit(0);
}, waitMs);
