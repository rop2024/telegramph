const express = require('express');
const { body, validationResult } = require('express-validator');
const Receiver = require('../models/Receiver');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// Validation rules
const receiverValidation = [
  body('name')
    .notEmpty()
    .withMessage('Receiver name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters')
    .trim(),
  
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters')
    .trim(),
  
  body('company')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters')
    .trim(),
  
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters')
    .trim(),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
    .trim()
];

// @route   POST /api/receivers
// @desc    Add a new receiver
// @access  Private
router.post('/', authMiddleware, receiverValidation, async (req, res) => {
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

    const { name, email, phone, company, department, tags, notes } = req.body;

    // Check if receiver with same email already exists for this user
    const existingReceiver = await Receiver.findOne({ 
      userId: req.user._id,
      email: email // This will compare encrypted values
    });

    if (existingReceiver) {
      return res.status(409).json({
        success: false,
        message: 'A receiver with this email already exists in your list'
      });
    }

    // Create new receiver
    const receiver = new Receiver({
      userId: req.user._id,
      name,
      email,
      phone: phone || '',
      company: company || '',
      department: department || '',
      tags: tags || [],
      notes: notes || ''
    });

    await receiver.save();

    // Decrypt email for response
    const receiverResponse = receiver.toObject();
    receiverResponse.email = receiver.decryptEmail();

    res.status(201).json({
      success: true,
      message: 'Receiver added successfully',
      data: {
        receiver: receiverResponse
      }
    });

  } catch (error) {
    console.error('Add receiver error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding receiver'
    });
  }
});

// @route   GET /api/receivers
// @desc    Get all receivers for current user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId: req.user._id };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      lean: true
    };

    // Get receivers with pagination
    const receivers = await Receiver.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    // Get total count for pagination
    const total = await Receiver.countDocuments(query);

    // Decrypt emails for all receivers
    const decryptedReceivers = Receiver.decryptReceivers(receivers);

    res.json({
      success: true,
      data: {
        receivers: decryptedReceivers,
        pagination: {
          currentPage: options.page,
          totalPages: Math.ceil(total / options.limit),
          totalReceivers: total,
          hasNext: options.page < Math.ceil(total / options.limit),
          hasPrev: options.page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get receivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching receivers'
    });
  }
});

// @route   GET /api/receivers/:id
// @desc    Get single receiver by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const receiver = await Receiver.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Decrypt email for response
    const receiverResponse = receiver.toObject();
    receiverResponse.email = receiver.decryptEmail();

    res.json({
      success: true,
      data: {
        receiver: receiverResponse
      }
    });

  } catch (error) {
    console.error('Get receiver error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching receiver'
    });
  }
});

// @route   PUT /api/receivers/:id
// @desc    Update a receiver
// @access  Private
router.put('/:id', authMiddleware, receiverValidation, async (req, res) => {
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

    const { name, email, phone, company, department, tags, notes } = req.body;

    // Find receiver and verify ownership
    const receiver = await Receiver.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Check for duplicate email (excluding current receiver)
    if (email !== receiver.decryptEmail()) {
      const existingReceiver = await Receiver.findOne({
        userId: req.user._id,
        email: email,
        _id: { $ne: req.params.id }
      });

      if (existingReceiver) {
        return res.status(409).json({
          success: false,
          message: 'Another receiver with this email already exists'
        });
      }
    }

    // Update receiver
    receiver.name = name;
    receiver.email = email; // Will be encrypted by pre-save hook
    receiver.phone = phone || '';
    receiver.company = company || '';
    receiver.department = department || '';
    receiver.tags = tags || [];
    receiver.notes = notes || '';

    await receiver.save();

    // Decrypt email for response
    const receiverResponse = receiver.toObject();
    receiverResponse.email = receiver.decryptEmail();

    res.json({
      success: true,
      message: 'Receiver updated successfully',
      data: {
        receiver: receiverResponse
      }
    });

  } catch (error) {
    console.error('Update receiver error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating receiver'
    });
  }
});

// @route   DELETE /api/receivers/:id
// @desc    Delete a receiver
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const receiver = await Receiver.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    res.json({
      success: true,
      message: 'Receiver deleted successfully'
    });

  } catch (error) {
    console.error('Delete receiver error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting receiver'
    });
  }
});

// @route   GET /api/receivers/stats/count
// @desc    Get receiver statistics for current user
// @access  Private
router.get('/stats/count', authMiddleware, async (req, res) => {
  try {
    const totalReceivers = await Receiver.countDocuments({ 
      userId: req.user._id 
    });

    const recentReceivers = await Receiver.countDocuments({
      userId: req.user._id,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    res.json({
      success: true,
      data: {
        total: totalReceivers,
        recent: recentReceivers
      }
    });

  } catch (error) {
    console.error('Get receiver stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching receiver statistics'
    });
  }
});

module.exports = router;