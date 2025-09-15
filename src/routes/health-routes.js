const express = require('express');
const router = express.Router();

/**
 * @route GET /health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'OpenSRS Domain Search API',
    version: '1.0.0'
  });
});

/**
 * @route GET /health/connectivity
 * @desc Test OpenSRS API connectivity
 * @access Public
 */
router.get('/health/connectivity', async (req, res) => {
  try {
    const result = await req.opensrsClient.testConnectivity();
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

