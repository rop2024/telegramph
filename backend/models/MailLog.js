const mongoose = require('mongoose');

const mailLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  draftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Draft',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Receiver',
    required: true
  },
  receiverEmail: {
    type: String,
    required: true
  },
  receiverName: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sending', 'sent', 'failed'],
    default: 'pending'
  },
  messageId: {
    type: String, // Nodemailer message ID
    sparse: true
  },
  error: {
    type: String
  },
  sentAt: {
    type: Date
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: {
    type: Date
  },
  metadata: {
    templateUsed: String,
    characterCount: Number,
    hasAttachments: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
mailLogSchema.index({ userId: 1, createdAt: -1 });
mailLogSchema.index({ draftId: 1 });
mailLogSchema.index({ receiverId: 1 });
mailLogSchema.index({ status: 1 });
mailLogSchema.index({ sentAt: 1 });

// Static method to get sending statistics
mailLogSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const total = await this.countDocuments({ userId: mongoose.Types.ObjectId(userId) });
  
  return {
    sent: stats.find(s => s._id === 'sent')?.count || 0,
    failed: stats.find(s => s._id === 'failed')?.count || 0,
    pending: stats.find(s => s._id === 'pending')?.count || 0,
    sending: stats.find(s => s._id === 'sending')?.count || 0,
    total: total
  };
};

// Static method to get draft sending statistics
mailLogSchema.statics.getDraftStats = async function(draftId) {
  const stats = await this.aggregate([
    { $match: { draftId: mongoose.Types.ObjectId(draftId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const total = await this.countDocuments({ draftId: mongoose.Types.ObjectId(draftId) });
  
  return {
    sent: stats.find(s => s._id === 'sent')?.count || 0,
    failed: stats.find(s => s._id === 'failed')?.count || 0,
    pending: stats.find(s => s._id === 'pending')?.count || 0,
    sending: stats.find(s => s._id === 'sending')?.count || 0,
    total: total
  };
};

module.exports = mongoose.model('MailLog', mailLogSchema);