const express = require('express');
const router = express.Router();
const OpenSRSClient = require('../lib/opensrs-client');

// Initialize OpenSRS client
const opensrsClient = new OpenSRSClient();

/**
 * @route POST /api/nameservers/update
 * @desc Advanced update nameservers for domain (assign or remove)
 * @access Public
 */
router.post('/update', async (req, res) => {
  try {
    const { domain, op_type, nameservers } = req.body;

    if (!domain || !op_type || !nameservers || !Array.isArray(nameservers)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: domain, op_type, nameservers (array)'
      });
    }

    if (!['assign', 'remove'].includes(op_type)) {
      return res.status(400).json({
        success: false,
        error: 'op_type must be "assign" or "remove"'
      });
    }

    if (nameservers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'nameservers array cannot be empty'
      });
    }

    console.log(`🔧 Advanced update nameservers for domain: ${domain}`);
    console.log(`🔧 Operation: ${op_type}`);
    console.log(`🔧 Nameservers: ${nameservers.join(', ')}`);

    const result = await opensrsClient.advancedUpdateNameservers(domain, op_type, nameservers);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to update nameservers',
        responseCode: result.responseCode,
        responseText: result.responseText
      });
    }

    res.json({
      success: true,
      domain: domain,
      operation: op_type,
      nameservers: nameservers,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });

  } catch (error) {
    console.error('Nameserver update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route GET /api/nameservers/:nameserver
 * @desc Get nameserver information
 * @access Public
 */
router.get('/:nameserver', async (req, res) => {
  try {
    const { nameserver } = req.params;

    if (!nameserver) {
      return res.status(400).json({
        success: false,
        error: 'nameserver parameter is required'
      });
    }

    console.log(`🔍 Getting nameserver info for: ${nameserver}`);

    const result = await opensrsClient.getNameserver(nameserver);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get nameserver information',
        responseCode: result.responseCode,
        responseText: result.responseText
      });
    }

    res.json({
      success: true,
      nameserver: nameserver,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });

  } catch (error) {
    console.error('Nameserver info retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route POST /api/nameservers/create
 * @desc Create a new nameserver
 * @access Public
 */
router.post('/create', async (req, res) => {
  try {
    const { nameserver, ip_addresses = [] } = req.body;

    if (!nameserver) {
      return res.status(400).json({
        success: false,
        error: 'nameserver is required'
      });
    }

    console.log(`🔧 Creating nameserver: ${nameserver}`);
    console.log(`🔧 IP addresses: ${ip_addresses.join(', ')}`);

    const result = await opensrsClient.createNameserver(nameserver, ip_addresses);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to create nameserver',
        responseCode: result.responseCode,
        responseText: result.responseText
      });
    }

    res.json({
      success: true,
      nameserver: nameserver,
      ip_addresses: ip_addresses,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });

  } catch (error) {
    console.error('Nameserver creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/nameservers/:nameserver
 * @desc Delete a nameserver
 * @access Public
 */
router.delete('/:nameserver', async (req, res) => {
  try {
    const { nameserver } = req.params;

    if (!nameserver) {
      return res.status(400).json({
        success: false,
        error: 'nameserver parameter is required'
      });
    }

    console.log(`🔧 Deleting nameserver: ${nameserver}`);

    const result = await opensrsClient.deleteNameserver(nameserver);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to delete nameserver',
        responseCode: result.responseCode,
        responseText: result.responseText
      });
    }

    res.json({
      success: true,
      nameserver: nameserver,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });

  } catch (error) {
    console.error('Nameserver deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/nameservers/:nameserver
 * @desc Modify a nameserver
 * @access Public
 */
router.put('/:nameserver', async (req, res) => {
  try {
    const { nameserver } = req.params;
    const { ip_addresses = [] } = req.body;

    if (!nameserver) {
      return res.status(400).json({
        success: false,
        error: 'nameserver parameter is required'
      });
    }

    console.log(`🔧 Modifying nameserver: ${nameserver}`);
    console.log(`🔧 New IP addresses: ${ip_addresses.join(', ')}`);

    const result = await opensrsClient.modifyNameserver(nameserver, ip_addresses);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to modify nameserver',
        responseCode: result.responseCode,
        responseText: result.responseText
      });
    }

    res.json({
      success: true,
      nameserver: nameserver,
      ip_addresses: ip_addresses,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });

  } catch (error) {
    console.error('Nameserver modification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route POST /api/nameservers/check
 * @desc Registry check nameserver
 * @access Public
 */
router.post('/check', async (req, res) => {
  try {
    const { nameserver, tld = null } = req.body;

    if (!nameserver) {
      return res.status(400).json({
        success: false,
        error: 'nameserver is required'
      });
    }

    console.log(`🔍 Registry check nameserver: ${nameserver}`);
    console.log(`🔍 TLD: ${tld || 'all'}`);

    const result = await opensrsClient.registryCheckNameserver(nameserver, tld);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to check nameserver',
        responseCode: result.responseCode,
        responseText: result.responseText
      });
    }

    res.json({
      success: true,
      nameserver: nameserver,
      tld: tld,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });

  } catch (error) {
    console.error('Nameserver check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
