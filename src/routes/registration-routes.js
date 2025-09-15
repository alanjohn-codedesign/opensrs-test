const express = require('express');
const router = express.Router();

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
      affiliateId = null
    } = req.body;

    // Validate required fields
    if (!domain || !regUsername || !regPassword || !contactSet || !contactSet.owner) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: domain, regUsername, regPassword, contactSet.owner'
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

    const result = await req.opensrsClient.registerDomain(registrationData);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Registration error:', error);
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

