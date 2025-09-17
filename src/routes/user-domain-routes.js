const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Domain = require('../models/Domain');

// Get all domains for a user
router.get('/user/:userId/domains', async (req, res) => {
  try {
    console.log('🔧 Route handler started');
    const { userId } = req.params;
    const { status, sort = '-registrationDate', limit = 50, page = 1 } = req.query;

    console.log('🔧 Getting domains for user:', userId);
    console.log('🔧 Query parameters:', { status, sort, limit, page });
    console.log('🔧 Request object keys:', Object.keys(req));
    console.log('🔧 Response object keys:', Object.keys(res));

    // Check if user exists
    let user;
    try {
      user = await User.findById(userId);
      console.log('🔧 User found:', user ? 'Yes' : 'No');
    } catch (userError) {
      console.error('❌ Error finding user:', userError.message);
      return res.status(500).json({
        success: false,
        error: `Database error: ${userError.message}`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Build query
    const query = { owner: userId };
    if (status) {
      query.status = status;
    }

    console.log('🔧 Domain query:', query);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get domains with pagination
    let domains;
    try {
      domains = await Domain.find(query)
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .populate('owner', 'username email firstName lastName');
      console.log('🔧 Domains found:', domains.length);
    } catch (domainError) {
      console.error('❌ Error finding domains:', domainError.message);
      return res.status(500).json({
        success: false,
        error: `Database error: ${domainError.message}`,
        timestamp: new Date().toISOString()
      });
    }

    // Get total count for pagination
    let totalDomains;
    try {
      totalDomains = await Domain.countDocuments(query);
      console.log('🔧 Total domains count:', totalDomains);
    } catch (countError) {
      console.error('❌ Error counting domains:', countError.message);
      return res.status(500).json({
        success: false,
        error: `Database error: ${countError.message}`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        domains: domains,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalDomains / limit),
          totalDomains: totalDomains,
          hasNextPage: (page * limit) < totalDomains,
          hasPrevPage: page > 1
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in user domains route:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific domain details
router.get('/domain/:domainId', async (req, res) => {
  try {
    const { domainId } = req.params;

    const domain = await Domain.findById(domainId)
      .populate('owner', 'username email firstName lastName');

    if (!domain) {
      return res.status(404).json({
        success: false,
        error: 'Domain not found'
      });
    }

    res.json({
      success: true,
      data: domain,
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

// Get domain by domain name
router.get('/domain/name/:domainName', async (req, res) => {
  try {
    const { domainName } = req.params;

    const domain = await Domain.findOne({ domainName: domainName.toLowerCase() })
      .populate('owner', 'username email firstName lastName');

    if (!domain) {
      return res.status(404).json({
        success: false,
        error: 'Domain not found'
      });
    }

    res.json({
      success: true,
      data: domain,
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

// Update domain information
router.put('/domain/:domainId', async (req, res) => {
  try {
    const { domainId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.domainName;
    delete updateData.owner;
    delete updateData.registrationDate;
    delete updateData.opensrsData;

    const domain = await Domain.findByIdAndUpdate(
      domainId,
      { ...updateData, lastUpdated: new Date() },
      { new: true, runValidators: true }
    ).populate('owner', 'username email firstName lastName');

    if (!domain) {
      return res.status(404).json({
        success: false,
        error: 'Domain not found'
      });
    }

    res.json({
      success: true,
      message: 'Domain updated successfully',
      data: domain,
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

// Update domain DNS records
router.put('/domain/:domainId/dns', async (req, res) => {
  try {
    const { domainId } = req.params;
    const { records } = req.body;

    if (!Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        error: 'Records must be an array'
      });
    }

    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({
        success: false,
        error: 'Domain not found'
      });
    }

    // Update DNS records in database
    await domain.updateDnsRecords(records);

    res.json({
      success: true,
      message: 'DNS records updated successfully',
      data: {
        domainId: domain._id,
        domainName: domain.domainName,
        recordCount: records.length,
        records: domain.dnsRecords
      },
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

// Add single DNS record to domain
router.post('/domain/:domainId/dns/add', async (req, res) => {
  try {
    const { domainId } = req.params;
    const { record } = req.body;

    if (!record || !record.type || !record.address) {
      return res.status(400).json({
        success: false,
        error: 'Record must have type and address'
      });
    }

    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({
        success: false,
        error: 'Domain not found'
      });
    }

    // Add DNS record to database
    await domain.addDnsRecord(record);

    res.json({
      success: true,
      message: 'DNS record added successfully',
      data: {
        domainId: domain._id,
        domainName: domain.domainName,
        newRecord: record,
        totalRecords: domain.dnsRecords.length
      },
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

// Get expiring domains
router.get('/domains/expiring', async (req, res) => {
  try {
    const { days = 30, userId } = req.query;

    let query = Domain.findExpiring(parseInt(days));
    
    if (userId) {
      query = query.where('owner').equals(userId);
    }

    const expiringDomains = await query.exec();

    res.json({
      success: true,
      data: {
        expiringDomains: expiringDomains,
        count: expiringDomains.length,
        daysThreshold: parseInt(days)
      },
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

// Get domain statistics
router.get('/user/:userId/domains/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get domain statistics
    const totalDomains = await Domain.countDocuments({ owner: userId });
    const activeDomains = await Domain.countDocuments({ owner: userId, status: 'active' });
    const expiredDomains = await Domain.countDocuments({ owner: userId, status: 'expired' });
    const expiringDomains = await Domain.countDocuments({
      owner: userId,
      status: 'active',
      expirationDate: {
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    // Get domains with DNS zones
    const domainsWithDns = await Domain.countDocuments({
      owner: userId,
      dnsZoneStatus: 'active'
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        },
        statistics: {
          totalDomains,
          activeDomains,
          expiredDomains,
          expiringDomains,
          domainsWithDns,
          autoRenewEnabled: await Domain.countDocuments({ owner: userId, autoRenew: true })
        }
      },
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

// Search domains by name or owner
router.get('/domains/search', async (req, res) => {
  try {
    const { q, owner, status, limit = 20, page = 1 } = req.query;

    if (!q && !owner) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) or owner parameter is required'
      });
    }

    // Build search query
    const searchQuery = {};

    if (q) {
      searchQuery.domainName = { $regex: q, $options: 'i' };
    }

    if (owner) {
      searchQuery.owner = owner;
    }

    if (status) {
      searchQuery.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Search domains
    const domains = await Domain.find(searchQuery)
      .sort({ domainName: 1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('owner', 'username email firstName lastName');

    // Get total count
    const totalResults = await Domain.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        domains: domains,
        searchQuery: { q, owner, status },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalResults / limit),
          totalResults: totalResults,
          hasNextPage: (page * limit) < totalResults,
          hasPrevPage: page > 1
        }
      },
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

// Delete domain from database (not from OpenSRS)
router.delete('/domain/:domainId', async (req, res) => {
  try {
    const { domainId } = req.params;

    const domain = await Domain.findByIdAndDelete(domainId);

    if (!domain) {
      return res.status(404).json({
        success: false,
        error: 'Domain not found'
      });
    }

    res.json({
      success: true,
      message: 'Domain removed from database successfully',
      data: {
        deletedDomain: {
          id: domain._id,
          domainName: domain.domainName
        }
      },
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

