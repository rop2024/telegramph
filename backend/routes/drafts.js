const express = require('express');
const { body, validationResult } = require('express-validator');
const Draft = require('../models/Draft');
const Receiver = require('../models/Receiver');
const { authMiddleware } = require('../middleware/authMiddleware');
const emailTemplates = require('../data/emailTemplates');
const router = express.Router();

// Validation rules
const draftValidation = [
  body('title')
    .notEmpty()
    .withMessage('Draft title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters')
    .trim(),
  
  body('subject')
    .notEmpty()
    .withMessage('Email subject is required')
    .isLength({ max: 300 })
    .withMessage('Subject cannot exceed 300 characters')
    .trim(),
  
  body('body')
    .notEmpty()
    .withMessage('Email body is required')
    .isLength({ max: 10000 })
    .withMessage('Body cannot exceed 10000 characters'),
  
  body('receivers')
    .optional()
    .isArray()
    .withMessage('Receivers must be an array'),
  
  body('template.name')
    .optional()
    .trim(),
  
  body('template.category')
    .optional()
    .isIn(['business', 'newsletter', 'promotional', 'personal', 'notification'])
    .withMessage('Invalid template category'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

// @route   GET /drafts/templates
// @desc    Get all available email templates
// @access  Private
router.get('/templates', authMiddleware, (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        templates: emailTemplates
      }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching templates'
    });
  }
});

// @route   GET /drafts/templates/:id
// @desc    Get specific template by ID
// @access  Private
router.get('/templates/:id', authMiddleware, (req, res) => {
  try {
    const template = emailTemplates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: {
        template
      }
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching template'
    });
  }
});

// @route   POST /drafts
// @desc    Create a new draft
// @access  Private
router.post('/', authMiddleware, draftValidation, async (req, res) => {
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

    const { title, subject, body, receivers = [], template = {}, tags = [] } = req.body;

    // Verify that all receivers belong to the current user
    if (receivers.length > 0) {
      const userReceivers = await Receiver.find({
        _id: { $in: receivers },
        userId: req.user._id
      });
      
      if (userReceivers.length !== receivers.length) {
        return res.status(400).json({
          success: false,
          message: 'Some receivers are invalid or do not belong to you'
        });
      }
    }

    // Create new draft
    const draft = new Draft({
      userId: req.user._id,
      title,
      subject,
      body,
      receivers,
      template: {
        name: template.name || 'default',
        category: template.category || 'business'
      },
      tags,
      status: 'draft'
    });

    await draft.save();

    // Populate receiver details for response
    await draft.populate('receivers', 'name email');

    res.status(201).json({
      success: true,
      message: 'Draft created successfully',
      data: {
        draft
      }
    });

  } catch (error) {
    console.error('Create draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating draft'
    });
  }
});

// @route   GET /drafts
// @desc    Get all drafts for current user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      category,
      search = '',
      sortBy = 'lastEdited',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId: req.user._id };
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by template category
    if (category && category !== 'all') {
      query['template.category'] = category;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    // Get drafts with pagination
    const drafts = await Draft.find(query)
      .populate('receivers', 'name email')
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    // Get total count for pagination
    const total = await Draft.countDocuments(query);

    res.json({
      success: true,
      data: {
        drafts,
        pagination: {
          currentPage: options.page,
          totalPages: Math.ceil(total / options.limit),
          totalDrafts: total,
          hasNext: options.page < Math.ceil(total / options.limit),
          hasPrev: options.page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching drafts'
    });
  }
});

// @route   GET /drafts/stats
// @desc    Get draft statistics for current user
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await Draft.getUserStats(req.user._id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get draft stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching draft statistics'
    });
  }
});

// @route   GET /drafts/:id
// @desc    Get single draft by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const draft = await Draft.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('receivers', 'name email company department');

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    res.json({
      success: true,
      data: {
        draft
      }
    });

  } catch (error) {
    console.error('Get draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching draft'
    });
  }
});

// @route   PUT /drafts/:id
// @desc    Update a draft
// @access  Private
router.put('/:id', authMiddleware, draftValidation, async (req, res) => {
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

    const { title, subject, body, receivers = [], template = {}, tags = [] } = req.body;

    // Find draft and verify ownership
    const draft = await Draft.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Verify that all receivers belong to the current user
    if (receivers.length > 0) {
      const userReceivers = await Receiver.find({
        _id: { $in: receivers },
        userId: req.user._id
      });
      
      if (userReceivers.length !== receivers.length) {
        return res.status(400).json({
          success: false,
          message: 'Some receivers are invalid or do not belong to you'
        });
      }
    }

    // Update draft
    draft.title = title;
    draft.subject = subject;
    draft.body = body;
    draft.receivers = receivers;
    draft.template = {
      name: template.name || draft.template.name,
      category: template.category || draft.template.category
    };
    draft.tags = tags;
    draft.lastEdited = new Date();

    await draft.save();
    await draft.populate('receivers', 'name email');

    res.json({
      success: true,
      message: 'Draft updated successfully',
      data: {
        draft
      }
    });

  } catch (error) {
    console.error('Update draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating draft'
    });
  }
});

// @route   DELETE /drafts/:id
// @desc    Delete a draft
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const draft = await Draft.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    res.json({
      success: true,
      message: 'Draft deleted successfully'
    });

  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting draft'
    });
  }
});

// @route   POST /drafts/:id/duplicate
// @desc    Duplicate a draft
// @access  Private
router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    const originalDraft = await Draft.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!originalDraft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Create duplicate
    const duplicateDraft = new Draft({
      userId: req.user._id,
      title: `${originalDraft.title} (Copy)`,
      subject: originalDraft.subject,
      body: originalDraft.body,
      receivers: originalDraft.receivers,
      template: originalDraft.template,
      tags: originalDraft.tags,
      status: 'draft'
    });

    await duplicateDraft.save();
    await duplicateDraft.populate('receivers', 'name email');

    res.status(201).json({
      success: true,
      message: 'Draft duplicated successfully',
      data: {
        draft: duplicateDraft
      }
    });

  } catch (error) {
    console.error('Duplicate draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while duplicating draft'
    });
  }
});

module.exports = router;