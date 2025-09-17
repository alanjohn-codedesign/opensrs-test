const express = require('express');
const router = express.Router();

/**
 * @route GET /health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const dbHealth = await req.database.healthCheck();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'OpenSRS Domain Management API',
      version: '1.0.0',
      database: dbHealth
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'OpenSRS Domain Management API',
      version: '1.0.0',
      database: {
        healthy: false,
        error: error.message
      }
    });
  }
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

