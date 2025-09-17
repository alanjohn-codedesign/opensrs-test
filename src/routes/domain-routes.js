const express = require('express');
const router = express.Router();
const OpenSRSClient = require('../lib/opensrs-client');

// Initialize OpenSRS client
const opensrsClient = new OpenSRSClient();

/**
 * @route POST /api/domains/search
 * @desc Search for domain suggestions with availability and pricing
 * @access Public
 */
router.post('/search', async (req, res) => {
  try {
    const { search_query } = req.body;

    if (!search_query) {
      return res.status(400).json({
        success: false,
        error: 'search_query is required'
      });
    }

    console.log(`🔍 Domain search request for: ${search_query}`);

    const result = await opensrsClient.searchDomainWithSuggestions(search_query);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to search domains'
      });
    }

    res.json(result.data);

  } catch (error) {
    console.error('Domain search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route POST /api/domains/lookup
 * @desc Check single domain availability
 * @access Public
 */
router.post('/lookup', async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'domain is required'
      });
    }

    console.log(`🔍 Domain lookup for: ${domain}`);

    const result = await opensrsClient.lookupDomain(domain);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to lookup domain'
      });
    }

    res.json({
      success: true,
      domain: domain,
      availability: result.data?.status || 'unknown',
      responseCode: result.responseCode,
      responseText: result.responseText
    });

  } catch (error) {
    console.error('Domain lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route GET /api/domains/:domain/price
 * @desc Get domain pricing
 * @access Public
 */
router.get('/:domain/price', async (req, res) => {
  try {
    const { domain } = req.params;

    console.log(`💰 Getting price for: ${domain}`);

    const result = await opensrsClient.getPrice(domain);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get domain price'
      });
    }

    res.json({
      success: true,
      domain: domain,
      price: result.data?.price || null,
      currency: result.data?.currency || 'USD',
      responseCode: result.responseCode,
      responseText: result.responseText
    });

  } catch (error) {
    console.error('Domain price error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route POST /api/domains/suggestions
 * @desc Get domain name suggestions
 * @access Public
 */
router.post('/suggestions', async (req, res) => {
  try {
    const { search_string } = req.body;

    if (!search_string) {
      return res.status(400).json({
        success: false,
        error: 'search_string is required'
      });
    }

    console.log(`💡 Getting suggestions for: ${search_string}`);

    const result = await opensrsClient.getNameSuggestions(search_string);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get domain suggestions'
      });
    }

    res.json({
      success: true,
      search_string: search_string,
      suggestions: result.data,
      responseCode: result.responseCode,
      responseText: result.responseText
    });

  } catch (error) {
    console.error('Domain suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route GET /api/domains/cache/stats
 * @desc Get cache statistics
 * @access Public
 */
router.get('/cache/stats', (req, res) => {
  try {
    const stats = opensrsClient.cache.getStats();
    res.json({
      success: true,
      cache_stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route POST /api/domains/cache/clear
 * @desc Clear expired cache entries
 * @access Public
 */
router.post('/cache/clear', (req, res) => {
  try {
    opensrsClient.cache.clearExpired();
    const stats = opensrsClient.cache.getStats();
    res.json({
      success: true,
      message: 'Expired cache entries cleared',
      cache_stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/domains/:domain/autorenew
 * @desc Modify domain auto-renew settings
 * @access Public
 */
router.put('/:domain/autorenew', async (req, res) => {
  try {
    const { domain } = req.params;
    const { autoRenew, letExpire } = req.body;

    if (typeof autoRenew !== 'boolean' && autoRenew !== 0 && autoRenew !== 1) {
      return res.status(400).json({
        success: false,
        error: 'autoRenew is required and must be 0, 1, true, or false'
      });
    }

    if (typeof letExpire !== 'boolean' && letExpire !== 0 && letExpire !== 1) {
      return res.status(400).json({
        success: false,
        error: 'letExpire is required and must be 0, 1, true, or false'
      });
    }

    console.log(`🔧 Modifying auto-renew for domain: ${domain}`);
    console.log(`🔧 Auto-renew: ${autoRenew}, Let expire: ${letExpire}`);

    const result = await opensrsClient.modifyDomain(domain, 'expire_action', {
      autoRenew: autoRenew === true || autoRenew === 1,
      letExpire: letExpire === true || letExpire === 1
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to modify domain auto-renew settings',
        responseCode: result.responseCode,
        responseText: result.responseText
      });
    }

    res.json({
      success: true,
      domain: domain,
      autoRenew: autoRenew === true || autoRenew === 1,
      letExpire: letExpire === true || letExpire === 1,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });

  } catch (error) {
    console.error('Domain auto-renew modification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route GET /api/domains/:domain/whois-privacy
 * @desc Get domain WHOIS privacy state
 * @access Public
 */
router.get('/:domain/whois-privacy', async (req, res) => {
  try {
    const { domain } = req.params;

    console.log(`🔍 Getting WHOIS privacy state for domain: ${domain}`);

    // Use the get domain info to retrieve current WHOIS privacy state
    const result = await opensrsClient.getDomain(domain, 'whois_privacy_state');

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get domain WHOIS privacy state',
        responseCode: result.responseCode,
        responseText: result.responseText
      });
    }

    // Extract WHOIS privacy state from the response
    let whoisPrivacyState = 'unknown';
    if (result.data && result.data.whois_privacy !== undefined) {
      whoisPrivacyState = result.data.whois_privacy ? 'enabled' : 'disabled';
    }

    res.json({
      success: true,
      domain: domain,
      whoisPrivacyState: whoisPrivacyState,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });

  } catch (error) {
    console.error('Domain WHOIS privacy retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/domains/:domain/whois-privacy
 * @desc Modify domain WHOIS privacy state
 * @access Public
 */
router.put('/:domain/whois-privacy', async (req, res) => {
  try {
    const { domain } = req.params;
    const { state } = req.body;

    if (!state || !['enable', 'disable'].includes(state)) {
      return res.status(400).json({
        success: false,
        error: 'state is required and must be "enable" or "disable"'
      });
    }

    console.log(`🔧 Modifying WHOIS privacy for domain: ${domain}`);
    console.log(`🔧 State: ${state}`);

    const result = await opensrsClient.modifyDomain(domain, 'whois_privacy_state', {
      state: state
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to modify domain WHOIS privacy state',
        responseCode: result.responseCode,
        responseText: result.responseText
      });
    }

    res.json({
      success: true,
      domain: domain,
      whoisPrivacyState: state,
      responseCode: result.responseCode,
      responseText: result.responseText,
      data: result.data
    });

  } catch (error) {
    console.error('Domain WHOIS privacy modification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route GET /api/domains/:domain/info
 * @desc Get complete domain information from OpenSRS
 * @access Public
 */
router.get('/:domain/info', async (req, res) => {
  try {
    const { domain } = req.params;
    const { type = 'all_info' } = req.query;

    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Domain is required',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔍 Getting domain information for: ${domain} (type: ${type})`);

    // Use the OpenSRS getDomain method which supports different types
    const result = await opensrsClient.getDomain(domain, type);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to get domain information',
        responseCode: result.responseCode,
        responseText: result.responseText,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      domain: domain,
      type: type,
      data: result.data,
      responseCode: result.responseCode,
      responseText: result.responseText,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Domain information retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
