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
      console.log('📋 Registration Response Data Keys:', Object.keys(result.data || {}));
      console.log('📋 Registration Response Data Values:', result.data);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to register domain',
          responseCode: result.responseCode,
          responseText: result.responseText
        });
      }

      // Filter out unnecessary fields for registration response
      const cleanData = {};
      if (result.data.order_id) cleanData.order_id = result.data.order_id;
      if (result.data.orderId) cleanData.orderId = result.data.orderId;
      if (result.data.id) cleanData.id = result.data.id;
      if (result.data.status) cleanData.status = result.data.status;
      if (result.data.expiry_date) cleanData.expiry_date = result.data.expiry_date;
      if (result.data.creation_date) cleanData.creation_date = result.data.creation_date;
      if (result.data.registrant_email) cleanData.registrant_email = result.data.registrant_email;
      if (result.data.admin_email) cleanData.admin_email = result.data.admin_email;
      if (result.data.transfer_id) cleanData.transfer_id = result.data.transfer_id;
      if (result.data.registration_text) cleanData.registration_text = result.data.registration_text;
      if (result.data.registration_code) cleanData.registration_code = result.data.registration_code;
      if (result.data.nameservers) cleanData.nameservers = result.data.nameservers;
      if (result.data.auto_renew) cleanData.auto_renew = result.data.auto_renew;
      if (result.data.whois_privacy) cleanData.whois_privacy = result.data.whois_privacy;

      res.json({
        success: true,
        domain,
        period: period || 1,
        responseCode: result.responseCode,
        responseText: result.responseText,
        orderId: result.data?.order_id || result.data?.orderId || result.data?.id || null,
        data: cleanData
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

    // Filter out unnecessary fields for pricing response
    const cleanData = {};
    if (result.data.price) cleanData.price = result.data.price;
    if (result.data.is_registry_premium) cleanData.is_registry_premium = result.data.is_registry_premium;
    if (result.data.registry_premium_group) cleanData.registry_premium_group = result.data.registry_premium_group;
    if (result.data.prices) cleanData.prices = result.data.prices;

    res.json({
      success: true,
      domain,
      data: cleanData
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

module.exports = router;
