const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)\.]+$/, 'Please enter a valid phone number']
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'US' }
  },
  opensrsCredentials: {
    username: { type: String, trim: true },
    apiKey: { type: String },
    testMode: { type: Boolean, default: true }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      if (ret.opensrsCredentials && ret.opensrsCredentials.apiKey) {
        delete ret.opensrsCredentials.apiKey;
      }
      delete ret.__v;
      return ret;
    }
  }
});

// Index for better query performance
userSchema.index({ 'opensrsCredentials.username': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Get user's domains count (virtual populate)
userSchema.virtual('domainsCount', {
  ref: 'Domain',
  localField: '_id',
  foreignField: 'owner',
  count: true
});

// Static method to find user by email or username
userSchema.statics.findByEmailOrUsername = function(emailOrUsername) {
  return this.findOne({
    $or: [
      { email: emailOrUsername },
      { username: emailOrUsername }
    ]
  });
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Instance method to get safe user data
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  if (userObject.opensrsCredentials) {
    delete userObject.opensrsCredentials.apiKey;
  }
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
