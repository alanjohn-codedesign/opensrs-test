const express = require('express');
const OpenSRSClient = require('../lib/opensrs-client');

const router = express.Router();
const opensrsClient = new OpenSRSClient();

/**
 * @swagger
 * /api/nameservers:
 *   post:
 *     summary: Create nameserver
 *     description: Create a new nameserver
 *     tags: [Nameservers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NameserverRequest'
 *     responses:
 *       200:
 *         description: Nameserver created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NameserverResponse'
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
router.post('/', async (req, res) => {
  try {
    const { nameserver, ip_address } = req.body;
    
    const result = await opensrsClient.createNameserver(nameserver, ip_address);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to create nameserver'
      });
    }

    res.json({
      success: true,
      nameserver,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });
  } catch (error) {
    console.error('Create nameserver error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/nameservers/{nameserver}:
 *   get:
 *     summary: Get nameserver
 *     description: Retrieve nameserver information
 *     tags: [Nameservers]
 *     parameters:
 *       - in: path
 *         name: nameserver
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
 *         example: "ns1.example.com"
 *     responses:
 *       200:
 *         description: Nameserver retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NameserverResponse'
 *       404:
 *         description: Nameserver not found
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
router.get('/:nameserver', async (req, res) => {
  try {
    const { nameserver } = req.params;
    
    const result = await opensrsClient.getNameserver(nameserver);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get nameserver'
      });
    }

    res.json({
      success: true,
      nameserver,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });
  } catch (error) {
    console.error('Get nameserver error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/nameservers/{nameserver}:
 *   put:
 *     summary: Modify nameserver
 *     description: Modify an existing nameserver
 *     tags: [Nameservers]
 *     parameters:
 *       - in: path
 *         name: nameserver
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
 *         example: "ns1.example.com"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['ip_address']
 *             properties:
 *               ip_address:
 *                 type: string
 *                 pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
 *                 example: "192.168.1.2"
 *     responses:
 *       200:
 *         description: Nameserver modified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NameserverResponse'
 *       404:
 *         description: Nameserver not found
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
router.put('/:nameserver', async (req, res) => {
  try {
    const { nameserver } = req.params;
    const { ip_address } = req.body;
    
    const result = await opensrsClient.modifyNameserver(nameserver, ip_address);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to modify nameserver'
      });
    }

    res.json({
      success: true,
      nameserver,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });
  } catch (error) {
    console.error('Modify nameserver error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/nameservers/{nameserver}:
 *   delete:
 *     summary: Delete nameserver
 *     description: Delete a nameserver
 *     tags: [Nameservers]
 *     parameters:
 *       - in: path
 *         name: nameserver
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
 *         example: "ns1.example.com"
 *     responses:
 *       200:
 *         description: Nameserver deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NameserverResponse'
 *       404:
 *         description: Nameserver not found
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
router.delete('/:nameserver', async (req, res) => {
  try {
    const { nameserver } = req.params;
    
    const result = await opensrsClient.deleteNameserver(nameserver);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to delete nameserver'
      });
    }

    res.json({
      success: true,
      nameserver,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });
  } catch (error) {
    console.error('Delete nameserver error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/nameservers/domains/{domain}/update:
 *   put:
 *     summary: Advanced update nameservers
 *     description: Update nameservers for a domain using advanced method
 *     tags: [Nameservers]
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
 *         example: "example.com"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['nameservers']
 *             properties:
 *               nameservers:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
 *                 minItems: 1
 *                 maxItems: 13
 *                 example: ["ns1.example.com", "ns2.example.com", "ns3.example.com"]
 *     responses:
 *       200:
 *         description: Nameservers updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NameserverResponse'
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
router.put('/domains/:domain/update', async (req, res) => {
  try {
    const { domain } = req.params;
    const { nameservers } = req.body;
    
    const result = await opensrsClient.advancedUpdateNameservers(domain, nameservers);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to update nameservers'
      });
    }

    res.json({
      success: true,
      domain,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });
  } catch (error) {
    console.error('Advanced update nameservers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
