const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
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
    ref: 'Receiver'
  }],
  cc: [{
    type: String,
    lowercase: true
  }],
  bcc: [{
    type: String,
    lowercase: true
  }],
  attachments: [{
    filename: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  scheduledSend: {
    type: Date,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Scheduled send time must be in the future'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent'],
    default: 'draft'
  },
  template: {
    type: String,
    default: 'default'
  },
  variables: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

draftSchema.index({ user: 1, status: 1 });
draftSchema.index({ scheduledSend: 1 });

module.exports = mongoose.model('Draft', draftSchema);