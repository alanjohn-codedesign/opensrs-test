const express = require('express');
const OpenSRSClient = require('../lib/opensrs-client');

const router = express.Router();
const opensrsClient = new OpenSRSClient();

/**
 * @swagger
 * /api/suggestions:
 *   post:
 *     summary: Get domain name suggestions
 *     description: Get domain name suggestions and availability lookups
 *     tags: [Suggestions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NameSuggestionsRequest'
 *     responses:
 *       200:
 *         description: Suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NameSuggestionsResponse'
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
    const { searchString, services, tlds, languages, maxWaitTime } = req.body;
    
    const result = await opensrsClient.getNameSuggestions(searchString, {
      services,
      tlds,
      languages,
      maxWaitTime
    });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get name suggestions'
      });
    }

    res.json({
      success: true,
      responseCode: result.responseCode,
      responseText: result.responseText,
      suggestions: result.suggestions,
      lookups: result.lookups,
      responseTime: result.responseTime
    });
  } catch (error) {
    console.error('Get name suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
