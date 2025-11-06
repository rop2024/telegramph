const express = require('express');
const { body, validationResult } = require('express-validator');
const Draft = require('../models/Draft');
const Receiver = require('../models/Receiver');
const MailLog = require('../models/MailLog');
const { authMiddleware } = require('../middleware/authMiddleware');
const emailService = require('../config/emailConfig');
const TemplateParser = require('../utils/templateParser');
const router = express.Router();

// @route   POST /api/mail/send
// @desc    Send email to selected receivers
// @access  Private
router.post('/send', authMiddleware, [
  body('draftId')
    .notEmpty()
    .withMessage('Draft ID is required')
    .isMongoId()
    .withMessage('Invalid draft ID'),
  
  body('receiverIds')
    .isArray({ min: 1 })
    .withMessage('At least one receiver is required'),
  
  body('receiverIds.*')
    .isMongoId()
    .withMessage('Invalid receiver ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { draftId, receiverIds } = req.body;

    // Verify draft exists and belongs to user
    const draft = await Draft.findOne({
      _id: draftId,
      userId: req.user._id
    }).populate('receivers');

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Verify receivers exist and belong to user
    const receivers = await Receiver.find({
      _id: { $in: receiverIds },
      userId: req.user._id
    });

    if (receivers.length !== receiverIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some receivers are invalid or do not belong to you'
      });
    }

    // Check if email service is configured
    if (!emailService.isConfigured) {
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please check your email settings.'
      });
    }

    // Create mail logs for tracking
    const mailLogs = [];
    const sendingPromises = [];

    for (const receiver of receivers) {
      // Create mail log entry
      const mailLog = new MailLog({
        userId: req.user._id,
        draftId: draft._id,
        receiverId: receiver._id,
        receiverEmail: receiver.email,
        receiverName: receiver.name,
        subject: draft.subject,
        status: 'pending',
        metadata: {
          templateUsed: draft.template.name,
          characterCount: draft.body.length,
          hasAttachments: false
        }
      });

      await mailLog.save();
      mailLogs.push(mailLog);

      // Prepare and send email
      const sendPromise = sendSingleEmail(draft, receiver, req.user, mailLog._id);
      sendingPromises.push(sendPromise);
    }

    // Wait for all emails to be processed
    const results = await Promise.allSettled(sendingPromises);

    // Count results
    const sentCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failedCount = results.length - sentCount;

    res.json({
      success: true,
      message: `Email sending completed. Sent: ${sentCount}, Failed: ${failedCount}`,
      data: {
        total: receivers.length,
        sent: sentCount,
        failed: failedCount,
        draftId: draft._id
      }
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending emails'
    });
  }
});

// @route   POST /api/mail/send-test
// @desc    Send test email to yourself
// @access  Private
router.post('/send-test', authMiddleware, [
  body('draftId')
    .notEmpty()
    .withMessage('Draft ID is required')
    .isMongoId()
    .withMessage('Invalid draft ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { draftId } = req.body;

    // Verify draft exists and belongs to user
    const draft = await Draft.findOne({
      _id: draftId,
      userId: req.user._id
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Check email service
    if (!emailService.isConfigured) {
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured'
      });
    }

    // Create test receiver object
    const testReceiver = {
      _id: req.user._id,
      name: req.user.username,
      email: req.user.email,
      company: 'Test Company',
      department: 'Test Department'
    };

    // Create mail log
    const mailLog = new MailLog({
      userId: req.user._id,
      draftId: draft._id,
      receiverId: testReceiver._id,
      receiverEmail: testReceiver.email,
      receiverName: testReceiver.name,
      subject: `[TEST] ${draft.subject}`,
      status: 'pending',
      metadata: {
        templateUsed: draft.template.name,
        characterCount: draft.body.length,
        hasAttachments: false,
        isTest: true
      }
    });

    await mailLog.save();

    // Send test email
    const result = await sendSingleEmail(
      draft, 
      testReceiver, 
      req.user, 
      mailLog._id,
      true // isTest
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully to your email address',
        data: {
          messageId: result.messageId
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending test email'
    });
  }
});

// @route   GET /api/mail/logs
// @desc    Get email sending logs for user
// @access  Private
router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      draftId,
      status,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId: req.user._id };
    
    if (draftId) {
      query.draftId = draftId;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { receiverName: { $regex: search, $options: 'i' } },
        { receiverEmail: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    // Get logs with pagination
    const logs = await MailLog.find(query)
      .populate('draftId', 'title draftId')
      .populate('receiverId', 'name email company')
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    // Get total count
    const total = await MailLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: options.page,
          totalPages: Math.ceil(total / options.limit),
          totalLogs: total,
          hasNext: options.page < Math.ceil(total / options.limit),
          hasPrev: options.page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get mail logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching mail logs'
    });
  }
});

// @route   GET /api/mail/stats
// @desc    Get email sending statistics
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await MailLog.getUserStats(req.user._id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get mail stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching mail statistics'
    });
  }
});

// @route   GET /api/mail/draft/:draftId/stats
// @desc    Get sending statistics for specific draft
// @access  Private
router.get('/draft/:draftId/stats', authMiddleware, async (req, res) => {
  try {
    // Verify draft belongs to user
    const draft = await Draft.findOne({
      _id: req.params.draftId,
      userId: req.user._id
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    const stats = await MailLog.getDraftStats(req.params.draftId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get draft mail stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching draft statistics'
    });
  }
});

// Helper function to send single email
async function sendSingleEmail(draft, receiver, user, mailLogId, isTest = false) {
  try {
    // Update mail log status to sending
    await MailLog.findByIdAndUpdate(mailLogId, {
      status: 'sending',
      lastRetryAt: new Date()
    });

    // Generate personalized content
    const personalizedContent = TemplateParser.generatePersonalizedContent(
      draft, 
      receiver, 
      user
    );

    const subject = isTest ? `[TEST] ${personalizedContent.subject}` : personalizedContent.subject;

    // Prepare email options
    const mailOptions = {
      from: {
        name: user.username || 'Newsletter System',
        address: process.env.SMTP_USER || process.env.GMAIL_USER
      },
      to: receiver.email,
      subject: subject,
      html: personalizedContent.body,
      text: personalizedContent.body.replace(/<[^>]*>/g, ''), // Plain text version
      headers: {
        'X-Mailer': 'Newsletter-System',
        'X-Draft-ID': draft._id.toString(),
        'X-Receiver-ID': receiver._id.toString()
      }
    };

    // Send email
    const result = await emailService.sendEmail(mailOptions);

    if (result.success) {
      // Update mail log for success
      await MailLog.findByIdAndUpdate(mailLogId, {
        status: 'sent',
        messageId: result.messageId,
        sentAt: new Date(),
        error: null
      });

      return { success: true, messageId: result.messageId };
    } else {
      // Update mail log for failure
      await MailLog.findByIdAndUpdate(mailLogId, {
        status: 'failed',
        error: result.error,
        retryCount: { $inc: 1 }
      });

      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error(`Error sending email to ${receiver.email}:`, error);
    
    // Update mail log for error
    await MailLog.findByIdAndUpdate(mailLogId, {
      status: 'failed',
      error: error.message,
      retryCount: { $inc: 1 }
    });

    return { success: false, error: error.message };
  }
}

module.exports = router;