const express = require('express');
const OpenSRSClient = require('../lib/opensrs-client');
const { createValidationMiddleware } = require('../validations/domain-validations');

const router = express.Router();
const opensrsClient = new OpenSRSClient();

/**
 * @swagger
 * /api/domains/lookup:
 *   post:
 *     summary: Check if a domain is available
 *     description: Check the availability of a single domain name
 *     tags: [Domains]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DomainLookupRequest'
 *           example:
 *             domain: "example.com"
 *     responses:
 *       200:
 *         description: Domain lookup successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DomainLookupResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/lookup', 
  createValidationMiddleware('lookupDomain'),
  async (req, res) => {
    try {
      const { domain } = req.body;
      
      console.log('🔍 Looking up domain:', domain);
      const result = await opensrsClient.lookupDomain(domain);
      console.log('📋 OpenSRS Response:', JSON.stringify(result, null, 2));
      
      // Handle different response scenarios
      let isAvailable = false;
      let responseMessage = 'Unknown status';
      
      if (result.success) {
        // Check response codes and messages
        if (result.responseCode === '200' || result.responseCode === '210') {
          isAvailable = true;
          responseMessage = 'Domain is available';
        } else if (result.responseCode === '211') {
          isAvailable = false;
          responseMessage = 'Domain is taken';
        } else {
          // Check data status if response code is unclear
          if (result.data?.status === 'available') {
            isAvailable = true;
            responseMessage = 'Domain is available';
          } else if (result.data?.status === 'taken') {
            isAvailable = false;
            responseMessage = 'Domain is taken';
          } else {
            // Check response text
            const responseText = result.responseText?.toLowerCase() || '';
            if (responseText.includes('available')) {
              isAvailable = true;
              responseMessage = 'Domain is available';
            } else if (responseText.includes('taken') || responseText.includes('not available')) {
              isAvailable = false;
              responseMessage = 'Domain is taken';
            }
          }
        }
      } else {
        // Handle error cases
        if (result.responseCode === '211') {
          isAvailable = false;
          responseMessage = 'Domain is taken';
        } else {
          isAvailable = false;
          responseMessage = result.responseText || 'Domain lookup failed';
        }
      }
      
      console.log('✅ Final availability check:', {
        responseCode: result.responseCode,
        responseText: result.responseText,
        dataStatus: result.data?.status,
        isAvailable: isAvailable,
        message: responseMessage
      });
      
      res.json({
        success: true,
        domain,
        available: isAvailable,
        responseCode: result.responseCode,
        responseText: result.responseText,
        message: responseMessage,
        data: result.data,
        timestamp: result.timestamp
      });
    } catch (error) {
      console.error('Domain lookup error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/domains/bulk-lookup:
 *   post:
 *     summary: Check availability for multiple domains
 *     description: Check the availability of multiple domain names in parallel
 *     tags: [Domains]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkDomainLookupRequest'
 *           example:
 *             domains: ["example.com", "test.com", "domain.org"]
 *     responses:
 *       200:
 *         description: Bulk domain lookup successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkDomainLookupResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/bulk-lookup',
  createValidationMiddleware('bulkLookup'),
  async (req, res) => {
    try {
      const { domains } = req.body;
      const results = [];

      // Process domains in parallel with rate limiting
      const promises = domains.map(async (domain) => {
        try {
          const result = await opensrsClient.lookupDomain(domain);
          const isAvailable = result.success && result.data.responseCode === '210';
          
          return {
            domain,
            available: isAvailable,
            success: result.success,
            responseCode: result.data?.responseCode,
            responseText: result.data?.responseText,
            error: result.success ? null : result.error
          };
        } catch (error) {
          return {
            domain,
            available: false,
            success: false,
            error: error.message
          };
        }
      });

      const domainResults = await Promise.all(promises);
      
      res.json({
        success: true,
        results: domainResults,
        total: domains.length,
        available: domainResults.filter(r => r.available).length
      });
    } catch (error) {
      console.error('Bulk domain lookup error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/domains/register:
 *   post:
 *     summary: Register a new domain
 *     description: Register a new domain with contact information and settings
 *     tags: [Domains]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DomainRegistrationRequest'
 *           example:
 *             domain: "example.com"
 *             period: 1
 *             auto_renew: false
 *             whois_privacy: false
 *             reg_username: "testuser"
 *             reg_password: "testpass123"
 *             registrant_contact:
 *               first_name: "John"
 *               last_name: "Doe"
 *               org_name: "Example Corp"
 *               address1: "123 Main St"
 *               city: "New York"
 *               state: "NY"
 *               country: "US"
 *               postal_code: "10001"
 *               phone: "+1.5551234567"
 *               email: "john@example.com"
 *             nameservers: ["ns1.systemdns.com", "ns2.systemdns.com"]
 *     responses:
 *       200:
 *         description: Domain registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DomainRegistrationResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register',
  createValidationMiddleware('registerDomain'),
  async (req, res) => {
    try {
      const { 
        domain, 
        period, 
        auto_renew, 
        whois_privacy, 
        registrant_contact, 
        admin_contact, 
        tech_contact, 
        billing_contact, 
        nameservers,
        reg_username,
        reg_password
      } = req.body;

      console.log('🏗️ Registering domain:', domain);
      console.log('📋 Registration data:', {
        domain,
        period,
        auto_renew,
        whois_privacy,
        hasRegistrantContact: !!registrant_contact,
        hasAdminContact: !!admin_contact,
        hasTechContact: !!tech_contact,
        hasBillingContact: !!billing_contact,
        nameserversCount: nameservers?.length || 0
      });

      // Prepare contact information for the client
      const contacts = {
        registrant_contact,
        ...(admin_contact && { admin_contact }),
        ...(tech_contact && { tech_contact }),
        ...(billing_contact && { billing_contact })
      };

      // Call the registerDomain with correct parameters
      const result = await opensrsClient.registerDomain(
        domain, 
        contacts, 
        period || 1, 
        nameservers || [],
        {
          auto_renew: auto_renew || false,
          whois_privacy: whois_privacy || false,
          reg_username: reg_username,
          reg_password: reg_password
        }
      );
      
      console.log('📋 OpenSRS Registration Response:', JSON.stringify(result, null, 2));
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to register domain',
          responseCode: result.responseCode,
          responseText: result.responseText
        });
      }

      res.json({
        success: true,
        domain,
        period: period || 1,
        responseCode: result.responseCode,
        responseText: result.responseText,
        orderId: result.data?.order_id || result.data?.orderId || null,
        data: result.data
      });
    } catch (error) {
      console.error('Domain registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/domains/{domain}:
 *   get:
 *     summary: Get domain information
 *     description: Retrieve detailed information about a specific domain
 *     tags: [Domains]
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
 *         example: "example.com"
 *         description: The domain name to get information for
 *     responses:
 *       200:
 *         description: Domain information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 domain:
 *                   type: string
 *                   example: "example.com"
 *                 data:
 *                   type: object
 *                   properties:
 *                     responseCode:
 *                       type: string
 *                       example: "200"
 *                     responseText:
 *                       type: string
 *                       example: "Domain information retrieved"
 *                     isSuccess:
 *                       type: boolean
 *                       example: true
 *       404:
 *         description: Domain not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    
    const result = await opensrsClient.getDomain(domain);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get domain information'
      });
    }

    res.json({
      success: true,
      domain,
      data: result.data
    });
  } catch (error) {
    console.error('Get domain error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route POST /api/domains/:domain/renew
 * @desc Renew a domain
 * @access Public
 */
router.post('/:domain/renew',
  createValidationMiddleware('renewDomain'),
  async (req, res) => {
    try {
      const { domain } = req.params;
      const { period } = req.body;
      
      const result = await opensrsClient.renewDomain(domain, period);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to renew domain'
        });
      }

      res.json({
        success: true,
        domain,
        period,
        responseCode: result.data.responseCode,
        responseText: result.data.responseText
      });
    } catch (error) {
      console.error('Domain renewal error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route PUT /api/domains/:domain
 * @desc Modify domain information
 * @access Public
 */
router.put('/:domain',
  createValidationMiddleware('modifyDomain'),
  async (req, res) => {
    try {
      const { domain } = req.params;
      const { nameservers, auto_renew, whois_privacy } = req.body;
      
      const attributes = {};
      
      if (nameservers) {
        attributes.nameserver_list = nameservers;
      }
      
      if (auto_renew !== undefined) {
        attributes.auto_renew = auto_renew ? 1 : 0;
      }
      
      if (whois_privacy !== undefined) {
        attributes.f_whois_privacy = whois_privacy ? 1 : 0;
      }
      
      const result = await opensrsClient.modifyDomain(domain, attributes);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to modify domain'
        });
      }

      res.json({
        success: true,
        domain,
        responseCode: result.data.responseCode,
        responseText: result.data.responseText
      });
    } catch (error) {
      console.error('Domain modification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route PUT /api/domains/:domain/contacts
 * @desc Update domain contacts
 * @access Public
 */
router.put('/:domain/contacts',
  createValidationMiddleware('updateContacts'),
  async (req, res) => {
    try {
      const { domain } = req.params;
      const { registrant_contact, admin_contact, tech_contact, billing_contact } = req.body;
      
      const contacts = {};
      
      if (registrant_contact) contacts.registrant_contact = registrant_contact;
      if (admin_contact) contacts.admin_contact = admin_contact;
      if (tech_contact) contacts.tech_contact = tech_contact;
      if (billing_contact) contacts.billing_contact = billing_contact;
      
      const result = await opensrsClient.updateContacts(domain, contacts);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to update domain contacts'
        });
      }

      res.json({
        success: true,
        domain,
        responseCode: result.data.responseCode,
        responseText: result.data.responseText
      });
    } catch (error) {
      console.error('Update contacts error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/domains/:domain/price
 * @desc Get domain pricing information
 * @access Public
 */
router.get('/:domain/price', async (req, res) => {
  try {
    const { domain } = req.params;
    
    const result = await opensrsClient.getPrice(domain);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get domain pricing'
      });
    }

    res.json({
      success: true,
      domain,
      data: result.data
    });
  } catch (error) {
    console.error('Get domain price error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/domains/bulk-price:
 *   post:
 *     summary: Get pricing for multiple domains
 *     description: Retrieve pricing information for multiple domains at once
 *     tags: [Domains]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               domains:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["example.com", "test.net", "mycompany.org"]
 *     responses:
 *       200:
 *         description: Bulk pricing successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       domain:
 *                         type: string
 *                       price:
 *                         type: string
 *                       success:
 *                         type: boolean
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/bulk-price', async (req, res) => {
  try {
    const { domains } = req.body;
    
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Domains array is required and must not be empty'
      });
    }

    // Limit to 20 domains to prevent overwhelming the API
    const domainsToCheck = domains.slice(0, 20);
    
    console.log('💰 Getting bulk pricing for domains:', domainsToCheck);
    
    // Get prices for all domains in parallel
    const pricePromises = domainsToCheck.map(async (domain) => {
      try {
        const result = await opensrsClient.getPrice(domain);
        return {
          domain,
          success: result.success,
          price: result.success ? result.data?.price : null,
          error: result.success ? null : result.error
        };
      } catch (error) {
        return {
          domain,
          success: false,
          price: null,
          error: error.message
        };
      }
    });

    const results = await Promise.all(pricePromises);
    
    res.json({
      success: true,
      results,
      total: results.length,
      successful: results.filter(r => r.success).length
    });
  } catch (error) {
    console.error('Bulk pricing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/domains:
 *   get:
 *     summary: Get all domains
 *     description: Retrieve list of all domains owned by the user
 *     tags: [Domains]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, deleted, all]
 *         description: Filter domains by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of domains to return
 *     responses:
 *       200:
 *         description: Domains retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 domains:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       domain:
 *                         type: string
 *                       status:
 *                         type: string
 *                       expiry_date:
 *                         type: string
 *                       auto_renew:
 *                         type: boolean
 *                       nameservers:
 *                         type: array
 *                         items:
 *                           type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const { status = 'all', limit = 100, startDate, endDate } = req.query;
    
    console.log('📋 Getting all domains with status:', status);
    
    let start, end;
    
    if (startDate && endDate) {
      // Use provided date range
      start = startDate;
      end = endDate;
    } else {
      // Use a very wide date range to get most domains
      const currentDate = new Date();
      const farFuture = new Date();
      farFuture.setFullYear(currentDate.getFullYear() + 10);
      
      start = currentDate.toISOString().split('T')[0];
      end = farFuture.toISOString().split('T')[0];
    }
    
    console.log('📅 Date range:', start, 'to', end);
    
    const result = await opensrsClient.getDomainsByExpireDate(start, end);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get domains list',
        responseCode: result.responseCode,
        responseText: result.responseText
      });
    }
    
    // Process the domains data
    let domains = [];
    if (result.data && result.data.domains) {
      domains = result.data.domains.map(domain => ({
        id: domain.id || domain.domain, // Use domain as ID if no ID provided
        domain: domain.domain,
        name: domain.domain, // Alias for easier access
        status: domain.status || 'active',
        expiry_date: domain.expiry_date,
        creation_date: domain.creation_date,
        auto_renew: domain.auto_renew === '1' || domain.auto_renew === 1,
        whois_privacy: domain.whois_privacy === '1' || domain.whois_privacy === 1,
        nameservers: domain.nameservers || [],
        registrant_email: domain.registrant_email,
        admin_email: domain.admin_email,
        tech_email: domain.tech_email,
        billing_email: domain.billing_email,
        tld: domain.domain?.split('.').pop() || '',
        registration_period: domain.registration_period,
        last_updated: domain.last_updated || new Date().toISOString()
      }));
    }
    
    // Filter by status if specified
    if (status !== 'all') {
      domains = domains.filter(domain => domain.status === status);
    }
    
    // Sort by domain name
    domains.sort((a, b) => a.domain.localeCompare(b.domain));
    
    // Limit results
    domains = domains.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      domains,
      total: domains.length,
      status: status,
      limit: parseInt(limit),
      dateRange: { start, end },
      message: `Found ${domains.length} domains`
    });
  } catch (error) {
    console.error('Get domains list error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/domains/deleted:
 *   get:
 *     summary: Get deleted domains
 *     description: Retrieve list of deleted domains
 *     tags: [Domains]
 *     responses:
 *       200:
 *         description: Deleted domains retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 deletedDomains:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       domain:
 *                         type: string
 *                       deletion_date:
 *                         type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @swagger
 * /api/domains/by-date-range:
 *   get:
 *     summary: Get domains by date range
 *     description: Retrieve domains that expire within a specific date range
 *     tags: [Domains]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Domains retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 domains:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       domain:
 *                         type: string
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       expiry_date:
 *                         type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/by-date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Both startDate and endDate are required (format: YYYY-MM-DD)'
      });
    }
    
    console.log('📅 Getting domains by date range:', startDate, 'to', endDate);
    
    const result = await opensrsClient.getDomainsByExpireDate(startDate, endDate);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get domains by date range',
        responseCode: result.responseCode,
        responseText: result.responseText
      });
    }
    
    // Process the domains data
    let domains = [];
    if (result.data && result.data.domains) {
      domains = result.data.domains.map(domain => ({
        id: domain.id || domain.domain,
        domain: domain.domain,
        name: domain.domain,
        status: domain.status || 'active',
        expiry_date: domain.expiry_date,
        creation_date: domain.creation_date,
        auto_renew: domain.auto_renew === '1' || domain.auto_renew === 1,
        whois_privacy: domain.whois_privacy === '1' || domain.whois_privacy === 1,
        nameservers: domain.nameservers || [],
        tld: domain.domain?.split('.').pop() || ''
      }));
    }
    
    res.json({
      success: true,
      domains,
      total: domains.length,
      dateRange: { startDate, endDate },
      message: `Found ${domains.length} domains in date range`
    });
  } catch (error) {
    console.error('Get domains by date range error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/domains/{domain}/orders:
 *   get:
 *     summary: Get orders for a domain
 *     description: Retrieve all orders associated with a specific domain
 *     tags: [Domains]
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         description: Domain name
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 domain:
 *                   type: string
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       order_id:
 *                         type: string
 *                       action:
 *                         type: string
 *                       status:
 *                         type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:domain/orders', async (req, res) => {
  try {
    const { domain } = req.params;
    
    console.log('📋 Getting orders for domain:', domain);
    
    const result = await opensrsClient.getOrdersByDomain(domain);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get domain orders',
        responseCode: result.responseCode,
        responseText: result.responseText
      });
    }
    
    res.json({
      success: true,
      domain,
      orders: result.data?.orders || [],
      total: result.data?.orders?.length || 0
    });
  } catch (error) {
    console.error('Get domain orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.get('/deleted', async (req, res) => {
  try {
    console.log('🗑️ Getting deleted domains');
    
    const result = await opensrsClient.getDeletedDomains();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get deleted domains'
      });
    }
    
    res.json({
      success: true,
      deletedDomains: result.data?.domains || [],
      total: result.data?.domains?.length || 0
    });
  } catch (error) {
    console.error('Get deleted domains error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
