const express = require('express');
const OpenSRSClient = require('../lib/opensrs-client');

const router = express.Router();
const opensrsClient = new OpenSRSClient();

/**
 * @swagger
 * /api/pricing/{domain}:
 *   get:
 *     summary: Get domain price
 *     description: Get pricing information for a specific domain
 *     tags: [Pricing]
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
 *         description: Price retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DomainPriceResponse'
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
    
    const result = await opensrsClient.getPrice(domain);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get domain price'
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
 * /api/pricing/bulk:
 *   post:
 *     summary: Get bulk domain pricing
 *     description: Get pricing information for multiple domains
 *     tags: [Pricing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkPriceRequest'
 *     responses:
 *       200:
 *         description: Bulk pricing retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkPriceResponse'
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
router.post('/bulk', async (req, res) => {
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







