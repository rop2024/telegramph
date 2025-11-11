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
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed', 'bounced'],
    required: true
  },
  messageId: {
    type: String,
    unique: true
  },
  errorMessage: {
    type: String
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: Date,
  openCount: {
    type: Number,
    default: 0
  },
  lastOpenedAt: Date,
  clickCount: {
    type: Number,
    default: 0
  },
  lastClickedAt: Date
}, {
  timestamps: true
});

mailLogSchema.index({ user: 1, sentAt: -1 });
mailLogSchema.index({ receiverEmail: 1 });
mailLogSchema.index({ messageId: 1 });

module.exports = mongoose.model('MailLog', mailLogSchema);