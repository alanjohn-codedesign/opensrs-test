const Joi = require('joi');

// Domain name validation schema
const domainNameSchema = Joi.string()
  .pattern(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)
  .min(3)
  .max(253)
  .required()
  .messages({
    'string.pattern.base': 'Domain name must be a valid domain format',
    'string.min': 'Domain name must be at least 3 characters long',
    'string.max': 'Domain name must not exceed 253 characters',
    'any.required': 'Domain name is required'
  });

// Contact information validation schema
const contactSchema = Joi.object({
  first_name: Joi.string().min(1).max(64).required(),
  last_name: Joi.string().min(1).max(64).required(),
  org_name: Joi.string().max(128).optional(),
  address1: Joi.string().min(1).max(128).required(),
  address2: Joi.string().max(128).optional(),
  city: Joi.string().min(1).max(128).required(),
  state: Joi.string().min(1).max(128).required(),
  country: Joi.string().length(2).required(),
  postal_code: Joi.string().min(1).max(16).required(),
  phone: Joi.string().min(10).max(17).required(),
  email: Joi.string().email().required(),
  fax: Joi.string().max(17).optional()
});

// Nameserver validation schema
const nameserverSchema = Joi.string()
  .pattern(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)
  .min(3)
  .max(253)
  .messages({
    'string.pattern.base': 'Nameserver must be a valid domain format',
    'string.min': 'Nameserver must be at least 3 characters long',
    'string.max': 'Nameserver must not exceed 253 characters'
  });

// Name suggestion validation schema
const nameSuggestionSchema = Joi.object({
  searchString: Joi.string().min(1).max(100).required()
    .messages({
      'string.min': 'Search string must be at least 1 character long',
      'string.max': 'Search string must not exceed 100 characters',
      'any.required': 'Search string is required'
    }),
  services: Joi.array().items(
    Joi.string().valid('lookup', 'suggestion', 'premium', 'personal_names')
  ).min(1).max(4).default(['lookup', 'suggestion'])
    .messages({
      'array.min': 'At least one service must be specified',
      'array.max': 'Maximum 4 services can be specified'
    }),
  tlds: Joi.array().items(
    Joi.string().pattern(/^\.[a-zA-Z0-9]+$/)
  ).min(1).max(50).default(['.com', '.net', '.org', '.info', '.biz', '.us', '.mobi'])
    .messages({
      'array.min': 'At least one TLD must be specified',
      'array.max': 'Maximum 50 TLDs can be specified',
      'string.pattern.base': 'TLD must start with a dot followed by alphanumeric characters'
    }),
  languages: Joi.array().items(
    Joi.string().valid('en', 'fr', 'de', 'it', 'es')
  ).min(1).max(5).default(['en'])
    .messages({
      'array.min': 'At least one language must be specified',
      'array.max': 'Maximum 5 languages can be specified'
    }),
  maxWaitTime: Joi.number().min(0.1).max(300).default(30)
    .messages({
      'number.min': 'Max wait time must be at least 0.1 seconds',
      'number.max': 'Max wait time must not exceed 300 seconds'
    }),
  searchKey: Joi.string().optional()
    .messages({
      'string.base': 'Search key must be a string'
    }),
  serviceOverride: Joi.object({
    lookup: Joi.boolean().optional(),
    suggestion: Joi.boolean().optional(),
    premium: Joi.boolean().optional()
  }).optional()
    .messages({
      'object.base': 'Service override must be an object'
    })
});

// Validation schemas for different endpoints
const validationSchemas = {
  // Domain lookup validation
  lookupDomain: Joi.object({
    domain: domainNameSchema
  }),

  // Domain registration validation
  registerDomain: Joi.object({
    domain: domainNameSchema,
    period: Joi.number().integer().min(1).max(10).default(1),
    auto_renew: Joi.boolean().default(false),
    whois_privacy: Joi.boolean().default(false),
    registrant_contact: contactSchema.required(),
    admin_contact: contactSchema.optional(),
    tech_contact: contactSchema.optional(),
    billing_contact: contactSchema.optional(),
    nameservers: Joi.array().items(nameserverSchema).min(1).max(13).optional(),
    reg_username: Joi.string().optional().messages({
      'string.base': 'Registration username must be a string'
    }),
    reg_password: Joi.string().optional().messages({
      'string.base': 'Registration password must be a string'
    })
  }),

  // Domain renewal validation
  renewDomain: Joi.object({
    domain: domainNameSchema,
    period: Joi.number().integer().min(1).max(10).default(1)
  }),

  // Domain modification validation
  modifyDomain: Joi.object({
    domain: domainNameSchema,
    nameservers: Joi.array().items(nameserverSchema).min(1).max(13).optional(),
    auto_renew: Joi.boolean().optional(),
    whois_privacy: Joi.boolean().optional()
  }),

  // Contact update validation
  updateContacts: Joi.object({
    domain: domainNameSchema,
    registrant_contact: contactSchema.optional(),
    admin_contact: contactSchema.optional(),
    tech_contact: contactSchema.optional(),
    billing_contact: contactSchema.optional()
  }),

  // Get domain information validation
  getDomain: Joi.object({
    domain: domainNameSchema
  }),

  // Get pricing validation
  getPrice: Joi.object({
    domain: domainNameSchema
  }),

  // Bulk domain lookup validation
  bulkLookup: Joi.object({
    domains: Joi.array().items(domainNameSchema).min(1).max(100).required()
  }),

  // Name suggestion validation
  nameSuggestion: nameSuggestionSchema
};

// Validation middleware factory
const createValidationMiddleware = (schemaName) => {
  return (req, res, next) => {
    const schema = validationSchemas[schemaName];
    if (!schema) {
      return res.status(500).json({ error: 'Validation schema not found' });
    }

    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Replace request body with validated data
    req.body = value;
    next();
  };
};

// Export validation schemas and middleware
module.exports = {
  validationSchemas,
  createValidationMiddleware,
  domainNameSchema,
  contactSchema,
  nameserverSchema
};
