const mongoose = require('mongoose');
const crypto = require('crypto-js');

const receiverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Receiver name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  // Encrypted email field
  email: {
    type: String,
    required: [true, 'Email is required']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Encrypt email before saving
receiverSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = crypto.AES.encrypt(
      this.email, 
      process.env.EMAIL_ENCRYPTION_KEY
    ).toString();
  }
  next();
});

// Instance method to decrypt email
receiverSchema.methods.decryptEmail = function() {
  try {
    const bytes = crypto.AES.decrypt(this.email, process.env.EMAIL_ENCRYPTION_KEY);
    return bytes.toString(crypto.enc.Utf8);
  } catch (error) {
    console.error('Email decryption error:', error);
    return null;
  }
};

// Static method to decrypt multiple receivers
receiverSchema.statics.decryptReceivers = function(receivers) {
  return receivers.map(receiver => {
    const receiverObj = receiver.toObject ? receiver.toObject() : receiver;
    try {
      const bytes = crypto.AES.decrypt(receiverObj.email, process.env.EMAIL_ENCRYPTION_KEY);
      receiverObj.email = bytes.toString(crypto.enc.Utf8);
    } catch (error) {
      console.error('Batch email decryption error:', error);
      receiverObj.email = null;
    }
    return receiverObj;
  });
};

// Index for better query performance
receiverSchema.index({ userId: 1, createdAt: -1 });
receiverSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Receiver', receiverSchema);