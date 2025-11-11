const express = require('express');
const { protect } = require('../middleware/auth');
const Receiver = require('../models/Receiver');
const { bulkDecryptSensitiveFields, decryptAES } = require('../utils/crypto');

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get all receivers for logged-in user
// @route   GET /api/receivers
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      tags,
      company,
      department,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query = { user: req.user.id };
    
    // Search functionality
    if (search) {
      // Since email is encrypted, we can't search by email directly
      // Search only by name, company, department, notes
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    // Filter by company
    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }

    // Filter by department
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const receivers = await Receiver.find(query)
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Use lean for better performance

    // Get total count for pagination
    const total = await Receiver.countDocuments(query);

    // Decrypt sensitive fields (emails) for all receivers
    const decryptedReceivers = bulkDecryptSensitiveFields(receivers, ['email']);

    res.status(200).json({
      success: true,
      count: decryptedReceivers.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: decryptedReceivers
    });
  } catch (error) {
    console.error('Get receivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving receivers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get single receiver
// @route   GET /api/receivers/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const receiver = await Receiver.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Convert to object and decrypt email
    const receiverObj = receiver.toObject();
    const decryptedReceiver = bulkDecryptSensitiveFields([receiverObj], ['email'])[0];

    res.status(200).json({
      success: true,
      data: decryptedReceiver
    });
  } catch (error) {
    console.error('Get receiver error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid receiver ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving receiver'
    });
  }
});

// @desc    Create new receiver
// @route   POST /api/receivers
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      company,
      department,
      tags,
      notes,
      customFields
    } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and email'
      });
    }

    // Check if receiver with same email already exists for this user
    const existingReceiver = await Receiver.findOne({
      user: req.user.id,
      // Note: We're checking against encrypted emails, so we need to handle this differently
      // For now, we'll rely on the unique index to catch duplicates
    });

    // Create receiver
    const receiver = await Receiver.createEncrypted({
      name,
      email: email.toLowerCase(),
      company,
      department,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : []),
      notes,
      customFields,
      user: req.user.id
    });

    // Get decrypted version for response
    const receiverObj = receiver.toObject();
    const decryptedReceiver = bulkDecryptSensitiveFields([receiverObj], ['email'])[0];

    res.status(201).json({
      success: true,
      message: 'Receiver created successfully',
      data: decryptedReceiver
    });
  } catch (error) {
    console.error('Create receiver error:', error);
    
    // Handle duplicate key error (unique constraint)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A receiver with this email already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating receiver',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update receiver
// @route   PUT /api/receivers/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      email,
      company,
      department,
      tags,
      notes,
      isActive,
      customFields
    } = req.body;

    // Find receiver and verify ownership
    let receiver = await Receiver.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Update receiver
    await receiver.updateEncrypted({
      name,
      email: email ? email.toLowerCase() : undefined,
      company,
      department,
      tags: tags !== undefined ? 
        (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : 
        undefined,
      notes,
      isActive,
      customFields
    });

    // Get updated receiver with decrypted email
    const updatedReceiver = await Receiver.findById(receiver._id);
    const receiverObj = updatedReceiver.toObject();
    const decryptedReceiver = bulkDecryptSensitiveFields([receiverObj], ['email'])[0];

    res.status(200).json({
      success: true,
      message: 'Receiver updated successfully',
      data: decryptedReceiver
    });
  } catch (error) {
    console.error('Update receiver error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid receiver ID'
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A receiver with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating receiver'
    });
  }
});

// @desc    Delete receiver
// @route   DELETE /api/receivers/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const receiver = await Receiver.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Receiver deleted successfully',
      data: {
        id: req.params.id
      }
    });
  } catch (error) {
    console.error('Delete receiver error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid receiver ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting receiver'
    });
  }
});

// @desc    Bulk delete receivers
// @route   DELETE /api/receivers/bulk/delete
// @access  Private
router.delete('/bulk/delete', async (req, res) => {
  try {
    const { receiverIds } = req.body;

    if (!receiverIds || !Array.isArray(receiverIds) || receiverIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of receiver IDs to delete'
      });
    }

    const result = await Receiver.deleteMany({
      _id: { $in: receiverIds },
      user: req.user.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No receivers found to delete'
      });
    }

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} receiver(s) deleted successfully`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Bulk delete receivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting receivers'
    });
  }
});

// @desc    Bulk create receivers
// @route   POST /api/receivers/bulk/create
// @access  Private
router.post('/bulk/create', async (req, res) => {
  try {
    const { receivers } = req.body;

    if (!receivers || !Array.isArray(receivers) || receivers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of receivers to create'
      });
    }

    // Validate each receiver
    const validReceivers = receivers.filter(receiver => 
      receiver.name && receiver.email
    );

    if (validReceivers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid receivers provided. Each receiver must have name and email.'
      });
    }

    // Create receivers
    const createdReceivers = await Receiver.bulkCreate(validReceivers, req.user.id);

    // Decrypt emails for response
    const receiverObjs = createdReceivers.map(receiver => receiver.toObject());
    const decryptedReceivers = bulkDecryptSensitiveFields(receiverObjs, ['email']);

    res.status(201).json({
      success: true,
      message: `${decryptedReceivers.length} receiver(s) created successfully`,
      data: decryptedReceivers
    });
  } catch (error) {
    console.error('Bulk create receivers error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'One or more receivers already exist with the same email'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating receivers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get receiver statistics
// @route   GET /api/receivers/stats/summary
// @access  Private
router.get('/stats/summary', async (req, res) => {
  try {
    const totalReceivers = await Receiver.countDocuments({ user: req.user.id });
    const activeReceivers = await Receiver.countDocuments({ 
      user: req.user.id, 
      isActive: true 
    });
    
    // Get tags statistics
    const tagsStats = await Receiver.aggregate([
      { $match: { user: req.user._id } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get companies statistics
    const companiesStats = await Receiver.aggregate([
      { $match: { user: req.user._id, company: { $exists: true, $ne: '' } } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalReceivers,
        active: activeReceivers,
        inactive: totalReceivers - activeReceivers,
        tags: tagsStats,
        companies: companiesStats
      }
    });
  } catch (error) {
    console.error('Get receiver stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving receiver statistics'
    });
  }
});

module.exports = router;