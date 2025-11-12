const mongoose = require('mongoose');

const mailLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  draft: {
    type: mongoose.Schema.ObjectId,
    ref: 'Draft',
    required: true
  },
  receiver: {
    type: mongoose.Schema.ObjectId,
    ref: 'Receiver',
    required: true
  },
  receiverEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  receiverName: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked'],
    default: 'pending'
  },
  messageId: {
    type: String
  },
  previewUrl: {
    type: String
  },
  errorMessage: {
    type: String
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  openedAt: {
    type: Date
  },
  openCount: {
    type: Number,
    default: 0
  },
  lastOpenedAt: {
    type: Date
  },
  clickedAt: {
    type: Date
  },
  clickCount: {
    type: Number,
    default: 0
  },
  lastClickedAt: {
    type: Date
  },
  trackingId: {
    type: String
  },
  emailProvider: {
    type: String,
    default: 'ethereal'
  },
  providerMessageId: {
    type: String
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: {
    type: Date
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
mailLogSchema.index({ user: 1, sentAt: -1 });
mailLogSchema.index({ receiverEmail: 1 });
mailLogSchema.index({ messageId: 1 }); // Not unique - multiple failed sends can have null messageId
mailLogSchema.index({ status: 1 });
mailLogSchema.index({ trackingId: 1 }, { unique: true, sparse: true });
mailLogSchema.index({ draft: 1 });
mailLogSchema.index({ 'metadata.campaignId': 1 });

// Static method to get sending statistics
mailLogSchema.statics.getSendingStats = function(userId, startDate, endDate) {
  const matchStage = {
    user: new mongoose.Types.ObjectId(userId),
    sentAt: { $gte: startDate, $lte: endDate, $exists: true }
  };

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalOpens: { $sum: '$openCount' },
        totalClicks: { $sum: '$clickCount' }
      }
    }
  ]);
};

// Static method to get campaign performance
mailLogSchema.statics.getCampaignPerformance = function(userId, draftId) {
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        draft: new mongoose.Types.ObjectId(draftId)
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        averageOpens: { $avg: '$openCount' },
        averageClicks: { $avg: '$clickCount' }
      }
    }
  ]);
};

// Instance method to mark as sent
mailLogSchema.methods.markAsSent = function(messageId, previewUrl) {
  this.status = 'sent';
  this.messageId = messageId;
  this.previewUrl = previewUrl;
  this.sentAt = new Date();
  return this.save();
};

// Instance method to mark as delivered
mailLogSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

// Instance method to mark as failed
mailLogSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.retryCount += 1;
  this.lastRetryAt = new Date();
  return this.save();
};

// Instance method to record open
mailLogSchema.methods.recordOpen = function() {
  this.openCount += 1;
  this.lastOpenedAt = new Date();
  
  if (this.status === 'sent' || this.status === 'delivered') {
    this.status = 'opened';
    this.openedAt = this.openedAt || new Date();
  }
  
  return this.save();
};

// Instance method to record click
mailLogSchema.methods.recordClick = function() {
  this.clickCount += 1;
  this.lastClickedAt = new Date();
  
  if (this.status !== 'clicked') {
    this.status = 'clicked';
    this.clickedAt = this.clickedAt || new Date();
  }
  
  return this.save();
};

// Generate tracking ID before saving
mailLogSchema.pre('save', function(next) {
  if (!this.trackingId) {
    const crypto = require('crypto');
    this.trackingId = crypto.randomBytes(16).toString('hex');
  }
  next();
});

module.exports = mongoose.model('MailLog', mailLogSchema);