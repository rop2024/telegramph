const mongoose = require('mongoose');
const { encryptAES, decryptAES } = require('../utils/crypto');

const receiverSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a receiver name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    lowercase: true
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [50, 'Department cannot be more than 50 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  customFields: {
    type: Map,
    of: String
  },
  emailEncrypted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for decrypted email (not stored in DB)
receiverSchema.virtual('decryptedEmail').get(function() {
  if (this.emailEncrypted && this.email) {
    try {
      return decryptAES(this.email);
    } catch (error) {
      console.error('Failed to decrypt email:', error);
      return this.email;
    }
  }
  return this.email;
});

// Pre-save middleware to encrypt email before saving
receiverSchema.pre('save', function(next) {
  // Only encrypt if email is modified and not already encrypted
  if (this.isModified('email') && !this.emailEncrypted) {
    try {
      // Validate email format before encryption
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(this.email)) {
        throw new Error('Please add a valid email');
      }
      
      this.email = encryptAES(this.email.toLowerCase());
      this.emailEncrypted = true;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-find middleware to handle queries (we'll decrypt after query)
receiverSchema.pre(/^find/, function(next) {
  // We'll handle decryption in post-find hooks or manually in routes
  next();
});

// Static method to create receiver with encryption
receiverSchema.statics.createEncrypted = async function(receiverData) {
  try {
    const receiver = new this(receiverData);
    await receiver.validate(); // Validate before saving
    return await receiver.save();
  } catch (error) {
    throw error;
  }
};

// Instance method to update receiver with encryption handling
receiverSchema.methods.updateEncrypted = async function(updateData) {
  try {
    Object.keys(updateData).forEach(key => {
      if (key === 'email' && updateData[key]) {
        // If email is being updated, reset encryption flag to trigger re-encryption
        this.emailEncrypted = false;
      }
      this[key] = updateData[key];
    });
    
    return await this.save();
  } catch (error) {
    throw error;
  }
};

// Static method to bulk create receivers
receiverSchema.statics.bulkCreate = async function(receiversData, userId) {
  try {
    const receivers = receiversData.map(data => ({
      ...data,
      user: userId
    }));
    
    return await this.insertMany(receivers);
  } catch (error) {
    throw error;
  }
};

// Compound index to ensure unique email per user (using encrypted emails)
receiverSchema.index({ user: 1, email: 1 }, { unique: true });

// Index for better query performance
receiverSchema.index({ user: 1, isActive: 1 });
receiverSchema.index({ user: 1, tags: 1 });
receiverSchema.index({ user: 1, company: 1 });

module.exports = mongoose.model('Receiver', receiverSchema);