const express = require('express');
const OpenSRSClient = require('../lib/opensrs-client');

const router = express.Router();
const opensrsClient = new OpenSRSClient();

/**
 * @swagger
 * /api/dns/zones:
 *   post:
 *     summary: Create DNS zone
 *     description: Create a new DNS zone for a domain
 *     tags: [DNS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DnsZoneRequest'
 *     responses:
 *       200:
 *         description: DNS zone created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DnsZoneResponse'
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
router.post('/zones', async (req, res) => {
  try {
    const { domain, records = [] } = req.body;
    
    const result = await opensrsClient.createDnsZone(domain, records);
    
    if (!result.success) {
      // Check if it's an authentication error (DNS management not available)
      if (result.responseCode === '415') {
        return res.status(403).json({
          success: false,
          error: 'DNS management not available',
          message: 'Your OpenSRS account does not have DNS management permissions. Please contact OpenSRS support to enable DNS zone management, or use the OpenSRS web interface.',
          responseCode: result.responseCode,
          responseText: result.responseText
        });
      }
      
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to create DNS zone',
        responseCode: result.responseCode,
        responseText: result.responseText
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
    console.error('Create DNS zone error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/dns/zones/{domain}:
 *   get:
 *     summary: Get DNS zone
 *     description: Retrieve DNS zone information for a domain
 *     tags: [DNS]
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
 *         example: "example.com"
 *     responses:
 *       200:
 *         description: DNS zone retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DnsZoneResponse'
 *       404:
 *         description: DNS zone not found
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
router.get('/zones/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    
    const result = await opensrsClient.getDnsZone(domain);
    
    if (!result.success) {
      // Check if it's an authentication error (DNS management not available)
      if (result.responseCode === '415') {
        return res.status(403).json({
          success: false,
          error: 'DNS management not available',
          message: 'Your OpenSRS account does not have DNS management permissions. Please contact OpenSRS support to enable DNS zone management, or use the OpenSRS web interface.',
          responseCode: result.responseCode,
          responseText: result.responseText
        });
      }
      
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get DNS zone',
        responseCode: result.responseCode,
        responseText: result.responseText
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
    console.error('Get DNS zone error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/dns/zones/{domain}/records:
 *   put:
 *     summary: Set DNS records
 *     description: Set DNS records for a domain zone
 *     tags: [DNS]
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
 *             $ref: '#/components/schemas/DnsRecordsRequest'
 *     responses:
 *       200:
 *         description: DNS records set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DnsZoneResponse'
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
router.put('/zones/:domain/records', async (req, res) => {
  try {
    const { domain } = req.params;
    const { records } = req.body;
    
    const result = await opensrsClient.setDnsZone(domain, records);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to set DNS records'
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
    console.error('Set DNS records error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/dns/zones/{domain}:
 *   delete:
 *     summary: Delete DNS zone
 *     description: Delete a DNS zone for a domain
 *     tags: [DNS]
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
 *         example: "example.com"
 *     responses:
 *       200:
 *         description: DNS zone deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DnsZoneResponse'
 *       404:
 *         description: DNS zone not found
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
router.delete('/zones/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    
    const result = await opensrsClient.deleteDnsZone(domain);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to delete DNS zone'
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
    console.error('Delete DNS zone error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/dns/zones/{domain}/reset:
 *   post:
 *     summary: Reset DNS zone
 *     description: Reset DNS zone to default settings
 *     tags: [DNS]
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
 *         example: "example.com"
 *     responses:
 *       200:
 *         description: DNS zone reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DnsZoneResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/zones/:domain/reset', async (req, res) => {
  try {
    const { domain } = req.params;
    
    const result = await opensrsClient.resetDnsZone(domain);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to reset DNS zone'
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
    console.error('Reset DNS zone error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;






