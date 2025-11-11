const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a draft title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject'],
    trim: true,
    maxlength: [200, 'Subject cannot be more than 200 characters']
  },
  body: {
    type: String,
    required: [true, 'Please add email body']
  },
  receivers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Receiver',
    required: true
  }],
  cc: [{
    type: String,
    lowercase: true,
    validate: {
      validator: function(email) {
        if (!email) return true;
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        return emailRegex.test(email);
      },
      message: 'Please add valid email addresses in CC'
    }
  }],
  bcc: [{
    type: String,
    lowercase: true,
    validate: {
      validator: function(email) {
        if (!email) return true;
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        return emailRegex.test(email);
      },
      message: 'Please add valid email addresses in BCC'
    }
  }],
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  scheduledSend: {
    type: Date,
    validate: {
      validator: function(date) {
        if (!date) return true;
        return date > new Date();
      },
      message: 'Scheduled send time must be in the future'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'archived'],
    default: 'draft'
  },
  template: {
    type: String,
    default: 'default'
  },
  variables: {
    type: Map,
    of: String
  },
  lastEdited: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot be more than 50 characters']
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for receiver count
draftSchema.virtual('receiverCount').get(function() {
  return this.receivers.length;
});

// Virtual for attachment count
draftSchema.virtual('attachmentCount').get(function() {
  return this.attachments.length;
});

// Virtual for total attachment size
draftSchema.virtual('totalAttachmentSize').get(function() {
  return this.attachments.reduce((total, attachment) => total + attachment.size, 0);
});

// Index for better query performance
draftSchema.index({ user: 1, status: 1 });
draftSchema.index({ user: 1, createdAt: -1 });
draftSchema.index({ user: 1, lastEdited: -1 });
draftSchema.index({ scheduledSend: 1 });
draftSchema.index({ user: 1, category: 1 });
draftSchema.index({ user: 1, tags: 1 });

// Pre-save middleware to update lastEdited and version
draftSchema.pre('save', function(next) {
  if (this.isModified('subject') || this.isModified('body') || this.isModified('receivers')) {
    this.lastEdited = new Date();
    
    // Only increment version for substantial changes, not status updates
    if (this.isModified('subject') || this.isModified('body')) {
      this.version += 1;
    }
  }
  next();
});

// Static method to get drafts by status
draftSchema.statics.getByStatus = function(userId, status, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ user: userId, status })
    .populate('receivers', 'name email company')
    .sort({ lastEdited: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get draft statistics
draftSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalReceivers: { $sum: { $size: '$receivers' } },
        latest: { $max: '$lastEdited' }
      }
    }
  ]);
};

// Instance method to duplicate draft
draftSchema.methods.duplicate = async function() {
  const duplicateData = {
    user: this.user,
    title: `${this.title} (Copy)`,
    subject: this.subject,
    body: this.body,
    receivers: [...this.receivers],
    cc: [...this.cc],
    bcc: [...this.bcc],
    template: this.template,
    variables: new Map(this.variables),
    category: this.category,
    tags: [...this.tags]
  };
  
  return await this.constructor.create(duplicateData);
};

// Instance method to add receiver
draftSchema.methods.addReceiver = async function(receiverId) {
  if (!this.receivers.includes(receiverId)) {
    this.receivers.push(receiverId);
    return await this.save();
  }
  return this;
};

// Instance method to remove receiver
draftSchema.methods.removeReceiver = async function(receiverId) {
  this.receivers = this.receivers.filter(id => id.toString() !== receiverId.toString());
  return await this.save();
};

// Instance method to update status
draftSchema.methods.updateStatus = async function(newStatus) {
  this.status = newStatus;
  if (newStatus === 'sent') {
    this.lastEdited = new Date();
  }
  return await this.save();
};

module.exports = mongoose.model('Draft', draftSchema);