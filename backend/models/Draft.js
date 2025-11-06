const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const draftSchema = new mongoose.Schema({
  draftId: {
    type: Number,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Draft title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  subject: {
    type: String,
    required: [true, 'Email subject is required'],
    trim: true,
    maxlength: [300, 'Subject cannot exceed 300 characters']
  },
  body: {
    type: String,
    required: [true, 'Email body is required'],
    maxlength: [10000, 'Body cannot exceed 10000 characters']
  },
  receivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Receiver'
  }],
  template: {
    name: {
      type: String,
      default: 'default'
    },
    category: {
      type: String,
      enum: ['business', 'newsletter', 'promotional', 'personal', 'notification'],
      default: 'business'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent'],
    default: 'draft'
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  lastEdited: {
    type: Date,
    default: Date.now
  },
  scheduledFor: {
    type: Date
  }
}, {
  timestamps: true
});

// Auto-increment draftId
draftSchema.plugin(AutoIncrement, { inc_field: 'draftId' });

// Update lastEdited timestamp before saving
draftSchema.pre('save', function(next) {
  this.lastEdited = new Date();
  next();
});

// Index for better query performance
draftSchema.index({ userId: 1, createdAt: -1 });
draftSchema.index({ userId: 1, status: 1 });
draftSchema.index({ userId: 1, 'template.category': 1 });

// Static method to get draft statistics
draftSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    draft: stats.find(s => s._id === 'draft')?.count || 0,
    scheduled: stats.find(s => s._id === 'scheduled')?.count || 0,
    sent: stats.find(s => s._id === 'sent')?.count || 0,
    total: stats.reduce((sum, s) => sum + s.count, 0)
  };
};

module.exports = mongoose.model('Draft', draftSchema);