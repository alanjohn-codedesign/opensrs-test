const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/dns/create-zone:
 *   post:
 *     summary: Create DNS zone for domain
 *     description: Create a new DNS zone with initial records
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *             properties:
 *               domain:
 *                 type: string
 *                 example: "example.com"
 *               records:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/DnsRecord'
 *     responses:
 *       200:
 *         description: DNS zone created successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: DNS zone creation failed
 */
router.post('/create-zone', async (req, res) => {
  try {
    const { domain, records = [] } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: domain'
      });
    }

    // Validate DNS records format
    for (const record of records) {
      if (!record.type || !record.address) {
        return res.status(400).json({
          success: false,
          error: 'Each DNS record must have type and address fields'
        });
      }
      
      // Validate MX records have priority
      if (record.type === 'MX' && !record.priority) {
        return res.status(400).json({
          success: false,
          error: 'MX records must include a priority field'
        });
      }
    }

    console.log('🔧 Creating DNS zone for domain:', domain);
    console.log('🔧 Records to create:', JSON.stringify(records, null, 2));

    // First check if domain exists by trying to get its info
    try {
      const domainCheck = await req.opensrsClient.lookupDomain(domain);
      console.log('🔍 Domain lookup result:', domainCheck);
      
      if (!domainCheck.success) {
        return res.status(400).json({
          success: false,
          error: `Domain ${domain} does not exist in your OpenSRS account or is not available`,
          details: domainCheck
        });
      }
    } catch (domainCheckError) {
      console.warn('⚠️ Could not verify domain existence:', domainCheckError.message);
    }

    const result = await req.opensrsClient.createDnsZone(domain, records);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DNS zone creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/dns/get-zone/{domain}:
 *   get:
 *     summary: Get DNS zone records
 *     description: Retrieve all DNS records for a domain
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         example: "example.com"
 *     responses:
 *       200:
 *         description: DNS zone records retrieved successfully
 *       400:
 *         description: Invalid domain parameter
 *       500:
 *         description: DNS zone retrieval failed
 */
router.get('/get-zone/:domain', async (req, res) => {
  try {
    const { domain } = req.params;

    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: domain'
      });
    }

    const result = await req.opensrsClient.getDnsZone(domain);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DNS zone retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/dns/set-zone:
 *   post:
 *     summary: Set/Update DNS zone records
 *     description: Replace all DNS records for a domain
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *               - records
 *             properties:
 *               domain:
 *                 type: string
 *                 example: "example.com"
 *               records:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/DnsRecord'
 *     responses:
 *       200:
 *         description: DNS zone updated successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: DNS zone update failed
 */
router.post('/set-zone', async (req, res) => {
  try {
    const { domain, records } = req.body;

    if (!domain || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: domain, records (array)'
      });
    }

    // Validate DNS records format
    for (const record of records) {
      if (!record.type || !record.address) {
        return res.status(400).json({
          success: false,
          error: 'Each DNS record must have type and address fields'
        });
      }
    }

    const result = await req.opensrsClient.setDnsZone(domain, records);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DNS zone update error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/dns/add-record:
 *   post:
 *     summary: Add a single DNS record
 *     description: |
 *       Add a new DNS record to existing zone (uses set_dns_zone internally).
 *       
 *       ⚠️ CRITICAL: OpenSRS set_dns_zone API REPLACES all existing records.
 *       This endpoint safely preserves existing records by:
 *       1. First retrieving all existing DNS records
 *       2. Adding the new record to the existing set
 *       3. Sending the complete record set to set_dns_zone
 *       
 *       This prevents accidental data loss when adding individual records.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *               - record
 *             properties:
 *               domain:
 *                 type: string
 *                 example: "example.com"
 *               record:
 *                 $ref: '#/components/schemas/DnsRecord'
 *     responses:
 *       200:
 *         description: DNS record added successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: DNS record addition failed or existing records could not be retrieved
 */
router.post('/add-record', async (req, res) => {
  try {
    const { domain, record } = req.body;

    if (!domain || !record || !record.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: domain, record.type'
      });
    }

    // Validate record has either value or address
    if (!record.value && !record.address) {
      return res.status(400).json({
        success: false,
        error: 'Record must have either value or address field'
      });
    }

    console.log('🔍 Adding DNS record for domain:', domain);
    console.log('🔍 New record to add:', JSON.stringify(record, null, 2));

    // Get existing records first - this is CRITICAL to prevent overwriting
    console.log('🔍 CRITICAL: Getting existing DNS records to prevent overwriting...');
    const existingZone = await req.opensrsClient.getDnsZone(domain);
    let existingRecords = [];
    
    console.log('🔍 Get DNS zone response:', JSON.stringify(existingZone, null, 2));
    
    if (existingZone.success && existingZone.data) {
      // Check different possible locations for records in the response
      if (existingZone.data.records) {
        existingRecords = existingZone.data.records;
        console.log('✅ Found existing records in data.records:', existingRecords.length);
      } else if (existingZone.data.attributes && existingZone.data.attributes.records) {
        existingRecords = existingZone.data.attributes.records;
        console.log('✅ Found existing records in data.attributes.records:', existingRecords.length);
      } else if (existingZone.attributes && existingZone.attributes.records) {
        existingRecords = existingZone.attributes.records;
        console.log('✅ Found existing records in attributes.records:', existingRecords.length);
      } else {
        console.log('⚠️ No records found in expected locations');
        console.log('🔍 Full data structure:', JSON.stringify(existingZone.data, null, 2));
      }
      
      console.log('🔍 Existing records:', JSON.stringify(existingRecords, null, 2));
    } else {
      console.log('⚠️ No existing records found or getDnsZone failed');
      console.log('🔍 Success:', existingZone.success);
      console.log('🔍 Data:', existingZone.data);
      console.log('🔍 Full response:', JSON.stringify(existingZone, null, 2));
      
      // If we can't get existing records, we should not proceed to avoid data loss
      if (!existingZone.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve existing DNS records. Cannot safely add new record without risking data loss.',
          details: existingZone,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Convert record to our internal format
    const newRecord = {
      type: record.type.toUpperCase(),
      subdomain: record.host || record.subdomain || '',
      address: record.value || record.address,
      ttl: record.ttl || 3600
    };

    // Add type-specific fields
    if (record.priority) newRecord.priority = record.priority;
    if (record.weight) newRecord.weight = record.weight;
    if (record.port) newRecord.port = record.port;

    // Add the new record to existing records
    const updatedRecords = [...existingRecords, newRecord];
    console.log('🔍 Updated records count:', updatedRecords.length);
    console.log('🔍 Existing records count:', existingRecords.length);
    console.log('🔍 New record being added:', JSON.stringify(newRecord, null, 2));
    console.log('🔍 All records to set (existing + new):', JSON.stringify(updatedRecords, null, 2));
    console.log('⚠️ WARNING: Using set_dns_zone which REPLACES all records. This is why we retrieved existing records first.');

    // Set the entire zone with updated records (this REPLACES all existing records)
    console.log('🔧 Calling setDnsZone with', updatedRecords.length, 'total records');
    const result = await req.opensrsClient.setDnsZone(domain, updatedRecords);
    
    res.json({
      success: result.success,
      data: result.data,
      message: result.success ? 'DNS record added successfully' : 'Failed to add DNS record',
      responseCode: result.responseCode,
      responseText: result.responseText,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DNS record addition error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/dns/update-record:
 *   post:
 *     summary: Update a single DNS record
 *     description: Update an existing DNS record (uses set_dns_zone internally)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *               - record
 *             properties:
 *               domain:
 *                 type: string
 *                 example: "example.com"
 *               record:
 *                 $ref: '#/components/schemas/DnsRecord'
 *     responses:
 *       200:
 *         description: DNS record updated successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: DNS record update failed
 */
router.post('/update-record', async (req, res) => {
  try {
    const { domain, record } = req.body;

    if (!domain || !record || !record.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: domain, record.type'
      });
    }

    // Validate record has either value or address
    if (!record.value && !record.address) {
      return res.status(400).json({
        success: false,
        error: 'Record must have either value or address field'
      });
    }

    console.log('🔍 Updating DNS record for domain:', domain);
    console.log('🔍 Record to update:', JSON.stringify(record, null, 2));

    // Get existing records first - this is CRITICAL to prevent overwriting
    console.log('🔍 CRITICAL: Getting existing DNS records to prevent overwriting...');
    const existingZone = await req.opensrsClient.getDnsZone(domain);
    let existingRecords = [];
    
    console.log('🔍 Get DNS zone response:', JSON.stringify(existingZone, null, 2));
    
    if (existingZone.success && existingZone.data) {
      // Check different possible locations for records in the response
      if (existingZone.data.records) {
        existingRecords = existingZone.data.records;
        console.log('✅ Found existing records in data.records:', existingRecords.length);
      } else if (existingZone.data.attributes && existingZone.data.attributes.records) {
        existingRecords = existingZone.data.attributes.records;
        console.log('✅ Found existing records in data.attributes.records:', existingRecords.length);
      } else if (existingZone.attributes && existingZone.attributes.records) {
        existingRecords = existingZone.attributes.records;
        console.log('✅ Found existing records in attributes.records:', existingRecords.length);
      } else {
        console.log('⚠️ No records found in expected locations');
        console.log('🔍 Full data structure:', JSON.stringify(existingZone.data, null, 2));
      }
      
      console.log('🔍 Existing records:', JSON.stringify(existingRecords, null, 2));
    } else {
      console.log('⚠️ No existing records found or getDnsZone failed');
      console.log('🔍 Success:', existingZone.success);
      console.log('🔍 Data:', existingZone.data);
      console.log('🔍 Full response:', JSON.stringify(existingZone, null, 2));
      
      // If we can't get existing records, we should not proceed to avoid data loss
      if (!existingZone.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve existing DNS records. Cannot safely update record without risking data loss.',
          details: existingZone,
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'No existing DNS zone found. Use add-record instead.',
        timestamp: new Date().toISOString()
      });
    }

    // Convert record to our internal format
    const updatedRecord = {
      type: record.type.toUpperCase(),
      subdomain: record.host || record.subdomain || '',
      address: record.value || record.address,
      ttl: record.ttl || 3600
    };

    // Add type-specific fields
    if (record.priority) updatedRecord.priority = record.priority;
    if (record.weight) updatedRecord.weight = record.weight;
    if (record.port) updatedRecord.port = record.port;

    // Find and replace the existing record (match by type and subdomain)
    const recordKey = `${updatedRecord.type}:${updatedRecord.subdomain}`;
    const updatedRecords = existingRecords.map(existingRecord => {
      const existingKey = `${existingRecord.type}:${existingRecord.subdomain}`;
      return existingKey === recordKey ? updatedRecord : existingRecord;
    });

    // If no matching record found, add it
    const recordExists = existingRecords.some(existingRecord => {
      const existingKey = `${existingRecord.type}:${existingRecord.subdomain}`;
      return existingKey === recordKey;
    });

    if (!recordExists) {
      updatedRecords.push(updatedRecord);
      console.log('🔍 Record not found, adding as new record');
    } else {
      console.log('🔍 Record found, updating existing record');
    }

    console.log('🔍 Updated records count:', updatedRecords.length);
    console.log('🔍 Existing records count:', existingRecords.length);
    console.log('🔍 Record being updated:', JSON.stringify(updatedRecord, null, 2));
    console.log('🔍 All records to set (existing + updated):', JSON.stringify(updatedRecords, null, 2));
    console.log('⚠️ WARNING: Using set_dns_zone which REPLACES all records. This is why we retrieved existing records first.');

    // Set the entire zone with updated records (this REPLACES all existing records)
    console.log('🔧 Calling setDnsZone with', updatedRecords.length, 'total records');
    const result = await req.opensrsClient.setDnsZone(domain, updatedRecords);
    
    res.json({
      success: result.success,
      data: result.data,
      message: result.success ? 'DNS record updated successfully' : 'Failed to update DNS record',
      responseCode: result.responseCode,
      responseText: result.responseText,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DNS record update error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/dns/delete-zone/{domain}:
 *   delete:
 *     summary: Delete DNS zone
 *     description: Delete entire DNS zone for a domain
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         example: "example.com"
 *     responses:
 *       200:
 *         description: DNS zone deleted successfully
 *       400:
 *         description: Invalid domain parameter
 *       500:
 *         description: DNS zone deletion failed
 */
router.delete('/delete-zone/:domain', async (req, res) => {
  try {
    const { domain } = req.params;

    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: domain'
      });
    }

    const result = await req.opensrsClient.deleteDnsZone(domain);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DNS zone deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

