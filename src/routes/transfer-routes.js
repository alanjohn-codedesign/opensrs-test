const express = require('express');
const OpenSRSClient = require('../lib/opensrs-client');

const router = express.Router();
const opensrsClient = new OpenSRSClient();

/**
 * @swagger
 * /api/transfers/check:
 *   post:
 *     summary: Check domain transfer
 *     description: Check if a domain can be transferred
 *     tags: [Transfers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['domain', 'auth_info']
 *             properties:
 *               domain:
 *                 type: string
 *                 pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
 *                 example: "example.com"
 *               auth_info:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 16
 *                 example: "ABC123XYZ"
 *     responses:
 *       200:
 *         description: Transfer check completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferResponse'
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
router.post('/check', async (req, res) => {
  try {
    const { domain, auth_info } = req.body;
    
    const result = await opensrsClient.checkTransfer(domain, auth_info);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to check transfer'
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
    console.error('Check transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/transfers/process:
 *   post:
 *     summary: Process domain transfer
 *     description: Initiate a domain transfer
 *     tags: [Transfers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferRequest'
 *     responses:
 *       200:
 *         description: Transfer initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferResponse'
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
router.post('/process', async (req, res) => {
  try {
    const { domain, auth_info, registrant_contact } = req.body;
    
    const result = await opensrsClient.processTransfer(domain, auth_info, { registrant_contact });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to process transfer'
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
    console.error('Process transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/transfers/{domain}/cancel:
 *   post:
 *     summary: Cancel domain transfer
 *     description: Cancel a pending domain transfer
 *     tags: [Transfers]
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
 *         description: Transfer cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferResponse'
 *       404:
 *         description: Transfer not found
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
router.post('/:domain/cancel', async (req, res) => {
  try {
    const { domain } = req.params;
    
    const result = await opensrsClient.cancelTransfer(domain);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to cancel transfer'
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
    console.error('Cancel transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/transfers/in:
 *   get:
 *     summary: Get transfers in
 *     description: Retrieve list of incoming domain transfers
 *     tags: [Transfers]
 *     responses:
 *       200:
 *         description: Transfers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransfersListResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/in', async (req, res) => {
  try {
    const result = await opensrsClient.getTransfersIn();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get transfers in'
      });
    }

    res.json({
      success: true,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });
  } catch (error) {
    console.error('Get transfers in error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/transfers/away:
 *   get:
 *     summary: Get transfers away
 *     description: Retrieve list of outgoing domain transfers
 *     tags: [Transfers]
 *     responses:
 *       200:
 *         description: Transfers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransfersListResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/away', async (req, res) => {
  try {
    const result = await opensrsClient.getTransfersAway();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get transfers away'
      });
    }

    res.json({
      success: true,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });
  } catch (error) {
    console.error('Get transfers away error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;







