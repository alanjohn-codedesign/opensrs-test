const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Domain = require('../models/Domain');

/**
 * @swagger
 * /api/registration/register:
 *   post:
 *     summary: Register a new domain
 *     description: Register a new domain with OpenSRS
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *               - regUsername
 *               - regPassword
 *               - contactSet
 *             properties:
 *               domain:
 *                 type: string
 *                 example: "example.com"
 *               handle:
 *                 type: string
 *                 enum: [save, process]
 *                 default: process
 *               autoRenew:
 *                 type: boolean
 *                 default: false
 *               period:
 *                 type: integer
 *                 default: 1
 *                 description: Registration period in years
 *               regUsername:
 *                 type: string
 *               regPassword:
 *                 type: string
 *               nameservers:
 *                 type: array
 *                 items:
 *                   type: string
 *               contactSet:
 *                 type: object
 *                 required:
 *                   - owner
 *                 properties:
 *                   owner:
 *                     $ref: '#/components/schemas/Contact'
 *                   admin:
 *                     $ref: '#/components/schemas/Contact'
 *                   tech:
 *                     $ref: '#/components/schemas/Contact'
 *                   billing:
 *                     $ref: '#/components/schemas/Contact'
 *     responses:
 *       200:
 *         description: Domain registration successful
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Registration failed
 */
router.post('/register', async (req, res) => {
  try {
    const {
      domain,
      handle = 'process',
      autoRenew = false,
      period = 1,
      regUsername,
      regPassword,
      nameservers = [],
      contactSet,
      customTldData = {},
      affiliateId = null,
      userId, // User ID who is registering the domain
      price = 0 // Registration price
    } = req.body;

    // Validate required fields
    if (!domain || !regUsername || !regPassword || !contactSet || !contactSet.owner || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: domain, regUsername, regPassword, contactSet.owner, userId'
      });
    }

    // Validate contact information
    const requiredContactFields = ['firstName', 'lastName', 'address1', 'city', 'country', 'postalCode', 'phone', 'email'];
    for (const field of requiredContactFields) {
      if (!contactSet.owner[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required contact field: owner.${field}`
        });
      }
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if domain is already registered in our database
    const existingDomain = await Domain.findOne({ domainName: domain.toLowerCase() });
    if (existingDomain) {
      return res.status(400).json({
        success: false,
        error: 'Domain is already registered in our system'
      });
    }

    const registrationData = {
      domain,
      handle,
      autoRenew: autoRenew ? 1 : 0,
      period,
      regUsername,
      regPassword,
      nameservers,
      contactSet,
      customTldData,
      affiliateId
    };

    // Register domain with OpenSRS
    const opensrsResult = await req.opensrsClient.registerDomain(registrationData);
    
    if (opensrsResult.success) {
      // Calculate expiration date
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + period);

      // Prepare nameservers array
      const nsArray = nameservers.map(ns => {
        if (typeof ns === 'string') {
          return { name: ns };
        }
        return { name: ns.name, ip: ns.ip };
      });

      // Create domain record in database
      const domainRecord = new Domain({
        domainName: domain.toLowerCase(),
        owner: userId,
        status: 'active',
        registrationDate: new Date(),
        expirationDate: expirationDate,
        autoRenew: autoRenew,
        registrationPeriod: period,
        registrationPrice: {
          amount: price,
          currency: 'USD'
        },
        opensrsData: {
          orderId: opensrsResult.data?.id,
          transferId: opensrsResult.data?.transferId,
          registrationId: opensrsResult.data?.registrationId,
          responseCode: opensrsResult.responseCode,
          responseText: opensrsResult.responseText
        },
        contacts: {
          owner: {
            firstName: contactSet.owner.firstName,
            lastName: contactSet.owner.lastName,
            email: contactSet.owner.email,
            phone: contactSet.owner.phone,
            organization: contactSet.owner.org || '',
            address1: contactSet.owner.address1,
            address2: contactSet.owner.address2 || '',
            city: contactSet.owner.city,
            state: contactSet.owner.state,
            postalCode: contactSet.owner.postalCode,
            country: contactSet.owner.country
          },
          admin: contactSet.admin ? {
            firstName: contactSet.admin.firstName,
            lastName: contactSet.admin.lastName,
            email: contactSet.admin.email,
            phone: contactSet.admin.phone,
            organization: contactSet.admin.org || '',
            address1: contactSet.admin.address1,
            address2: contactSet.admin.address2 || '',
            city: contactSet.admin.city,
            state: contactSet.admin.state,
            postalCode: contactSet.admin.postalCode,
            country: contactSet.admin.country
          } : null,
          tech: contactSet.tech ? {
            firstName: contactSet.tech.firstName,
            lastName: contactSet.tech.lastName,
            email: contactSet.tech.email,
            phone: contactSet.tech.phone,
            organization: contactSet.tech.org || '',
            address1: contactSet.tech.address1,
            address2: contactSet.tech.address2 || '',
            city: contactSet.tech.city,
            state: contactSet.tech.state,
            postalCode: contactSet.tech.postalCode,
            country: contactSet.tech.country
          } : null,
          billing: contactSet.billing ? {
            firstName: contactSet.billing.firstName,
            lastName: contactSet.billing.lastName,
            email: contactSet.billing.email,
            phone: contactSet.billing.phone,
            organization: contactSet.billing.org || '',
            address1: contactSet.billing.address1,
            address2: contactSet.billing.address2 || '',
            city: contactSet.billing.city,
            state: contactSet.billing.state,
            postalCode: contactSet.billing.postalCode,
            country: contactSet.billing.country
          } : null
        },
        nameservers: nsArray,
        dnsRecords: [],
        dnsZoneStatus: 'inactive'
      });

      // Save domain to database
      await domainRecord.save();

      res.json({
        success: true,
        message: 'Domain registered successfully and saved to database',
        data: {
          opensrsResult: opensrsResult,
          domainRecord: {
            id: domainRecord._id,
            domainName: domainRecord.domainName,
            status: domainRecord.status,
            expirationDate: domainRecord.expirationDate,
            autoRenew: domainRecord.autoRenew
          }
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // OpenSRS registration failed
      res.status(500).json({
        success: false,
        error: 'Domain registration failed with OpenSRS',
        opensrsError: opensrsResult.error,
        responseCode: opensrsResult.responseCode,
        responseText: opensrsResult.responseText,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/registration/modify:
 *   post:
 *     summary: Modify domain properties
 *     description: Modify various domain properties like nameservers, auto-renew, contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *               - modificationType
 *             properties:
 *               domain:
 *                 type: string
 *                 example: "example.com"
 *               modificationType:
 *                 type: string
 *                 enum: [nameserver_list, auto_renew, contact_info, locking]
 *               nameservers:
 *                 type: array
 *                 items:
 *                   type: string
 *               autoRenew:
 *                 type: boolean
 *               contactSet:
 *                 type: object
 *               lockState:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Domain modification successful
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Modification failed
 */
router.post('/modify', async (req, res) => {
  try {
    const {
      domain,
      modificationType,
      ...modificationData
    } = req.body;

    if (!domain || !modificationType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: domain, modificationType'
      });
    }

    const result = await req.opensrsClient.modifyDomain(domain, modificationType, modificationData);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Modification error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

