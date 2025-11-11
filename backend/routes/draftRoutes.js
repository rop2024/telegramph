const express = require('express');
const { protect } = require('../middleware/auth');
const Draft = require('../models/Draft');
const Receiver = require('../models/Receiver');

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get all drafts for logged-in user with filtering and pagination
// @route   GET /api/drafts
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      tags,
      sortBy = 'lastEdited',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query = { user: req.user.id };
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const drafts = await Draft.find(query)
      .populate('receivers', 'name email company')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await Draft.countDocuments(query);

    // Add virtual fields to response
    const draftsWithVirtuals = drafts.map(draft => ({
      ...draft,
      receiverCount: draft.receivers.length,
      attachmentCount: draft.attachments ? draft.attachments.length : 0,
      totalAttachmentSize: draft.attachments ? 
        draft.attachments.reduce((total, att) => total + att.size, 0) : 0
    }));

    res.status(200).json({
      success: true,
      count: draftsWithVirtuals.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: draftsWithVirtuals
    });
  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving drafts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get single draft
// @route   GET /api/drafts/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const draft = await Draft.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('receivers', 'name email company department tags');

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Convert to object to include virtuals
    const draftObj = draft.toObject();
    draftObj.receiverCount = draft.receivers.length;
    draftObj.attachmentCount = draft.attachments.length;
    draftObj.totalAttachmentSize = draft.attachments.reduce((total, att) => total + att.size, 0);

    res.status(200).json({
      success: true,
      data: draftObj
    });
  } catch (error) {
    console.error('Get draft error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid draft ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving draft'
    });
  }
});

// @desc    Create new draft
// @route   POST /api/drafts
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      title,
      subject,
      body,
      receivers,
      cc,
      bcc,
      template,
      variables,
      category,
      tags,
      scheduledSend
    } = req.body;

    // Validation
    if (!title || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, subject, and body'
      });
    }

    // Validate receivers exist and belong to user
    if (receivers && receivers.length > 0) {
      const validReceivers = await Receiver.find({
        _id: { $in: receivers },
        user: req.user.id
      });
      
      if (validReceivers.length !== receivers.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more receivers are invalid or do not belong to you'
        });
      }
    }

    // Create draft
    const draft = await Draft.create({
      title,
      subject,
      body,
      receivers: receivers || [],
      cc: cc || [],
      bcc: bcc || [],
      template: template || 'default',
      variables: variables || {},
      category,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : []),
      scheduledSend,
      user: req.user.id
    });

    // Populate receivers for response
    await draft.populate('receivers', 'name email company');

    // Convert to object to include virtuals
    const draftObj = draft.toObject();
    draftObj.receiverCount = draft.receivers.length;
    draftObj.attachmentCount = 0;
    draftObj.totalAttachmentSize = 0;

    res.status(201).json({
      success: true,
      message: 'Draft created successfully',
      data: draftObj
    });
  } catch (error) {
    console.error('Create draft error:', error);
    
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
      message: 'Error creating draft',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update draft
// @route   PUT /api/drafts/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      subject,
      body,
      receivers,
      cc,
      bcc,
      template,
      variables,
      category,
      tags,
      scheduledSend,
      status
    } = req.body;

    // Find draft and verify ownership
    let draft = await Draft.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Validate receivers if provided
    if (receivers && receivers.length > 0) {
      const validReceivers = await Receiver.find({
        _id: { $in: receivers },
        user: req.user.id
      });
      
      if (validReceivers.length !== receivers.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more receivers are invalid or do not belong to you'
        });
      }
    }

    // Update fields
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (subject !== undefined) updateFields.subject = subject;
    if (body !== undefined) updateFields.body = body;
    if (receivers !== undefined) updateFields.receivers = receivers;
    if (cc !== undefined) updateFields.cc = cc;
    if (bcc !== undefined) updateFields.bcc = bcc;
    if (template !== undefined) updateFields.template = template;
    if (variables !== undefined) updateFields.variables = variables;
    if (category !== undefined) updateFields.category = category;
    if (tags !== undefined) updateFields.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    if (scheduledSend !== undefined) updateFields.scheduledSend = scheduledSend;
    if (status !== undefined) updateFields.status = status;

    // Update draft
    draft = await Draft.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('receivers', 'name email company');

    // Convert to object to include virtuals
    const draftObj = draft.toObject();
    draftObj.receiverCount = draft.receivers.length;
    draftObj.attachmentCount = draft.attachments.length;
    draftObj.totalAttachmentSize = draft.attachments.reduce((total, att) => total + att.size, 0);

    res.status(200).json({
      success: true,
      message: 'Draft updated successfully',
      data: draftObj
    });
  } catch (error) {
    console.error('Update draft error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid draft ID'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating draft'
    });
  }
});

// @desc    Delete draft
// @route   DELETE /api/drafts/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const draft = await Draft.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Draft deleted successfully',
      data: {
        id: req.params.id,
        title: draft.title
      }
    });
  } catch (error) {
    console.error('Delete draft error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid draft ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting draft'
    });
  }
});

// @desc    Duplicate draft
// @route   POST /api/drafts/:id/duplicate
// @access  Private
router.post('/:id/duplicate', async (req, res) => {
  try {
    const draft = await Draft.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Use the instance method to duplicate
    const duplicatedDraft = await draft.duplicate();
    
    // Populate receivers for response
    await duplicatedDraft.populate('receivers', 'name email company');

    // Convert to object to include virtuals
    const draftObj = duplicatedDraft.toObject();
    draftObj.receiverCount = duplicatedDraft.receivers.length;
    draftObj.attachmentCount = duplicatedDraft.attachments.length;
    draftObj.totalAttachmentSize = duplicatedDraft.attachments.reduce((total, att) => total + att.size, 0);

    res.status(201).json({
      success: true,
      message: 'Draft duplicated successfully',
      data: draftObj
    });
  } catch (error) {
    console.error('Duplicate draft error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid draft ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error duplicating draft'
    });
  }
});

// @desc    Bulk delete drafts
// @route   DELETE /api/drafts/bulk/delete
// @access  Private
router.delete('/bulk/delete', async (req, res) => {
  try {
    const { draftIds } = req.body;

    if (!draftIds || !Array.isArray(draftIds) || draftIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of draft IDs to delete'
      });
    }

    const result = await Draft.deleteMany({
      _id: { $in: draftIds },
      user: req.user.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No drafts found to delete'
      });
    }

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} draft(s) deleted successfully`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Bulk delete drafts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting drafts'
    });
  }
});

// @desc    Update draft status
// @route   PATCH /api/drafts/:id/status
// @access  Private
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['draft', 'scheduled', 'sent', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (draft, scheduled, sent, archived)'
      });
    }

    const draft = await Draft.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id
      },
      { status },
      { new: true }
    ).populate('receivers', 'name email company');

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Convert to object to include virtuals
    const draftObj = draft.toObject();
    draftObj.receiverCount = draft.receivers.length;
    draftObj.attachmentCount = draft.attachments.length;
    draftObj.totalAttachmentSize = draft.attachments.reduce((total, att) => total + att.size, 0);

    res.status(200).json({
      success: true,
      message: `Draft status updated to ${status}`,
      data: draftObj
    });
  } catch (error) {
    console.error('Update draft status error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid draft ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating draft status'
    });
  }
});

// @desc    Get draft statistics
// @route   GET /api/drafts/stats/summary
// @access  Private
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Draft.getStats(req.user.id);
    
    // Format stats
    const formattedStats = {
      total: 0,
      byStatus: {},
      totalReceivers: 0
    };

    stats.forEach(stat => {
      formattedStats.total += stat.count;
      formattedStats.totalReceivers += stat.totalReceivers;
      formattedStats.byStatus[stat._id] = {
        count: stat.count,
        totalReceivers: stat.totalReceivers,
        latest: stat.latest
      };
    });

    // Get categories count
    const categories = await Draft.aggregate([
      { $match: { user: req.user._id, category: { $exists: true, $ne: '' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get tags count
    const tags = await Draft.aggregate([
      { $match: { user: req.user._id } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...formattedStats,
        categories,
        popularTags: tags
      }
    });
  } catch (error) {
    console.error('Get draft stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving draft statistics'
    });
  }
});

// @desc    Add receiver to draft
// @route   POST /api/drafts/:id/receivers
// @access  Private
router.post('/:id/receivers', async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a receiver ID'
      });
    }

    // Verify receiver exists and belongs to user
    const receiver = await Receiver.findOne({
      _id: receiverId,
      user: req.user.id
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    const draft = await Draft.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Use instance method to add receiver
    await draft.addReceiver(receiverId);
    
    // Populate and return updated draft
    await draft.populate('receivers', 'name email company');

    const draftObj = draft.toObject();
    draftObj.receiverCount = draft.receivers.length;

    res.status(200).json({
      success: true,
      message: 'Receiver added to draft successfully',
      data: draftObj
    });
  } catch (error) {
    console.error('Add receiver to draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding receiver to draft'
    });
  }
});

// @desc    Remove receiver from draft
// @route   DELETE /api/drafts/:id/receivers/:receiverId
// @access  Private
router.delete('/:id/receivers/:receiverId', async (req, res) => {
  try {
    const draft = await Draft.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Use instance method to remove receiver
    await draft.removeReceiver(req.params.receiverId);
    
    // Populate and return updated draft
    await draft.populate('receivers', 'name email company');

    const draftObj = draft.toObject();
    draftObj.receiverCount = draft.receivers.length;

    res.status(200).json({
      success: true,
      message: 'Receiver removed from draft successfully',
      data: draftObj
    });
  } catch (error) {
    console.error('Remove receiver from draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing receiver from draft'
    });
  }
});

module.exports = router;