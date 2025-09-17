const mongoose = require('mongoose');

const dnsRecordSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS', 'PTR'],
    uppercase: true
  },
  subdomain: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  ttl: {
    type: Number,
    default: 3600,
    min: 300,
    max: 86400
  },
  priority: {
    type: Number,
    min: 0,
    max: 65535
  },
  weight: {
    type: Number,
    min: 0,
    max: 65535
  },
  port: {
    type: Number,
    min: 1,
    max: 65535
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const nameserverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ip: {
    type: String,
    trim: true,
    match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Please enter a valid IP address']
  }
}, { _id: false });

const contactSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: { 
    type: String, 
    required: true, 
    trim: true,
    match: [/^\+?[\d\s\-\(\)\.]+$/, 'Please enter a valid phone number']
  },
  organization: { type: String, trim: true },
  address1: { type: String, required: true, trim: true },
  address2: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, default: 'US' }
}, { _id: false });

const domainSchema = new mongoose.Schema({
  domainName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$/, 'Please enter a valid domain name']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'suspended', 'deleted', 'transferred'],
    default: 'pending'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  expirationDate: {
    type: Date,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  registrationPeriod: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 1
  },
  registrationPrice: {
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'USD' }
  },
  opensrsData: {
    orderId: { type: String },
    transferId: { type: String },
    registrationId: { type: String },
    responseCode: { type: String },
    responseText: { type: String }
  },
  contacts: {
    owner: { type: contactSchema, required: true },
    admin: { type: contactSchema },
    tech: { type: contactSchema },
    billing: { type: contactSchema }
  },
  nameservers: [nameserverSchema],
  dnsRecords: [dnsRecordSchema],
  dnsZoneStatus: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'inactive'
  },
  privacyProtection: {
    enabled: { type: Boolean, default: false },
    expirationDate: { type: Date }
  },
  lockStatus: {
    transferLock: { type: Boolean, default: true },
    deleteLock: { type: Boolean, default: true }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  tags: [{ type: String, trim: true }],
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
domainSchema.index({ owner: 1 });
domainSchema.index({ status: 1 });
domainSchema.index({ expirationDate: 1 });
domainSchema.index({ registrationDate: 1 });
domainSchema.index({ 'opensrsData.orderId': 1 });

// Virtual for days until expiration
domainSchema.virtual('daysUntilExpiration').get(function() {
  if (!this.expirationDate) return null;
  const now = new Date();
  const diffTime = this.expirationDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for full domain info
domainSchema.virtual('domainInfo').get(function() {
  return {
    name: this.domainName,
    status: this.status,
    daysUntilExpiration: this.daysUntilExpiration,
    autoRenew: this.autoRenew
  };
});

// Pre-save middleware to update lastUpdated
domainSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to find domains by owner
domainSchema.statics.findByOwner = function(userId, options = {}) {
  const query = this.find({ owner: userId });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.sort) {
    query.sort(options.sort);
  } else {
    query.sort({ registrationDate: -1 });
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query.populate('owner', 'username email firstName lastName');
};

// Static method to find expiring domains
domainSchema.statics.findExpiring = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expirationDate: { $lte: futureDate },
    status: 'active'
  }).populate('owner', 'username email firstName lastName');
};

// Instance method to update DNS records
domainSchema.methods.updateDnsRecords = function(records) {
  this.dnsRecords = records.map(record => ({
    ...record,
    lastModified: new Date()
  }));
  return this.save();
};

// Instance method to add DNS record
domainSchema.methods.addDnsRecord = function(record) {
  this.dnsRecords.push({
    ...record,
    lastModified: new Date()
  });
  return this.save();
};

// Instance method to check if domain is expired
domainSchema.methods.isExpired = function() {
  return this.expirationDate < new Date();
};

// Instance method to check if domain is expiring soon
domainSchema.methods.isExpiringSoon = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return this.expirationDate <= futureDate;
};

// Instance method to calculate renewal date
domainSchema.methods.calculateRenewalDate = function(years = 1) {
  const renewalDate = new Date(this.expirationDate);
  renewalDate.setFullYear(renewalDate.getFullYear() + years);
  return renewalDate;
};

module.exports = mongoose.model('Domain', domainSchema);
