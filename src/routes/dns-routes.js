const express = require('express');
const router = express.Router();
router.get('/get-zone/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Domain is required',
        timestamp: new Date().toISOString()
      });
    }

    
    const result = await req.opensrsClient.getDnsZone(domain);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          domain: domain,
          records: result.data.records || [],
          recordCount: result.data.records ? result.data.records.length : 0
        },
        responseCode: result.responseCode,
        responseText: result.responseText,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to retrieve DNS zone',
        responseCode: result.responseCode,
        responseText: result.responseText,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('DNS zone retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/set-zone', async (req, res) => {
  try {
    const { domain, records } = req.body;
    
    if (!domain || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        error: 'Domain and records array are required',
        timestamp: new Date().toISOString()
      });
    }

    
    const result = await req.opensrsClient.setDnsZone(domain, records);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'DNS zone updated successfully',
        data: {
          domain: domain,
          recordCount: records.length,
          records: records
        },
        responseCode: result.responseCode,
        responseText: result.responseText,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to update DNS zone',
        responseCode: result.responseCode,
        responseText: result.responseText,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('DNS zone update error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/add-record', async (req, res) => {
  try {
    const { domain, record } = req.body;
    
    if (!domain || !record) {
      return res.status(400).json({
        success: false,
        error: 'Domain and record are required',
        timestamp: new Date().toISOString()
      });
    }

    // Validate record structure
    if (!record.type || !record.address) {
      return res.status(400).json({
        success: false,
        error: 'Record must have type and address',
        timestamp: new Date().toISOString()
      });
    }

    
    // Step 1: Get existing DNS records
    const existingZone = await req.opensrsClient.getDnsZone(domain);
    
    if (!existingZone.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve existing DNS records: ' + (existingZone.error || 'Unknown error'),
        responseCode: existingZone.responseCode,
        responseText: existingZone.responseText,
        timestamp: new Date().toISOString()
      });
    }

    // Step 2: Combine existing records with new record
    const existingRecords = existingZone.data.records || [];
    
    // Add TTL default if not specified
    if (!record.ttl) {
      record.ttl = 3600;
    }
    
    const allRecords = [...existingRecords, record];
    
    // Step 3: Update DNS zone with all records
    const updateResult = await req.opensrsClient.setDnsZone(domain, allRecords);
    
    if (updateResult.success) {
      res.json({
        success: true,
        message: 'DNS record added successfully',
        data: {
          domain: domain,
          newRecord: record,
          totalRecords: allRecords.length,
          existingRecords: existingRecords.length,
          workflow: {
            step1_retrieve: {
              success: true,
              recordCount: existingRecords.length
            },
            step2_merge: {
              success: true,
              totalRecords: allRecords.length
            },
            step3_update: {
              success: true,
              responseCode: updateResult.responseCode
            }
          }
        },
        responseCode: updateResult.responseCode,
        responseText: updateResult.responseText,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: updateResult.error || 'Failed to add DNS record',
        responseCode: updateResult.responseCode,
        responseText: updateResult.responseText,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('DNS record addition error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/update-record', async (req, res) => {
  try {
    const { domain, oldRecord, newRecord } = req.body;
    
    if (!domain || !oldRecord || !newRecord) {
      return res.status(400).json({
        success: false,
        error: 'Domain, oldRecord, and newRecord are required',
        timestamp: new Date().toISOString()
      });
    }

    
    // Step 1: Get existing DNS records
    const existingZone = await req.opensrsClient.getDnsZone(domain);
    
    if (!existingZone.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve existing DNS records: ' + (existingZone.error || 'Unknown error'),
        timestamp: new Date().toISOString()
      });
    }

    const existingRecords = existingZone.data.records || [];
    
    // Step 2: Find and replace the record
    let recordFound = false;
    const updatedRecords = existingRecords.map(record => {
      // Match by type and subdomain primarily
      if (record.type === oldRecord.type && 
          (record.subdomain || '') === (oldRecord.subdomain || '')) {
        
        // For more specific matching, also check address if provided
        if (oldRecord.address && record.address !== oldRecord.address) {
          return record; // Not the record we're looking for
        }
        
        recordFound = true;
        // Add TTL default if not specified in new record
        if (!newRecord.ttl) {
          newRecord.ttl = record.ttl || 3600;
        }
        return newRecord;
      }
      return record;
    });
    
    if (!recordFound) {
      return res.status(404).json({
        success: false,
        error: 'Record to update not found',
        searchCriteria: oldRecord,
        availableRecords: existingRecords,
        timestamp: new Date().toISOString()
      });
    }
    
    // Step 3: Update DNS zone with modified records
    const updateResult = await req.opensrsClient.setDnsZone(domain, updatedRecords);
    
    if (updateResult.success) {
      res.json({
        success: true,
        message: 'DNS record updated successfully',
        data: {
          domain: domain,
          oldRecord: oldRecord,
          newRecord: newRecord,
          totalRecords: updatedRecords.length
        },
        responseCode: updateResult.responseCode,
        responseText: updateResult.responseText,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: updateResult.error || 'Failed to update DNS record',
        responseCode: updateResult.responseCode,
        responseText: updateResult.responseText,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('DNS record update error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/delete-record', async (req, res) => {
  try {
    const { domain, record } = req.body;
    
    if (!domain || !record) {
      return res.status(400).json({
        success: false,
        error: 'Domain and record are required',
        timestamp: new Date().toISOString()
      });
    }

    
    // Step 1: Get existing DNS records
    const existingZone = await req.opensrsClient.getDnsZone(domain);
    
    if (!existingZone.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve existing DNS records: ' + (existingZone.error || 'Unknown error'),
        timestamp: new Date().toISOString()
      });
    }

    const existingRecords = existingZone.data.records || [];
    
    // Step 2: Filter out the record to delete
    let recordFound = false;
    const remainingRecords = existingRecords.filter(existingRecord => {
      // Match by type and subdomain primarily
      const typeMatch = existingRecord.type === record.type;
      const subdomainMatch = (existingRecord.subdomain || '') === (record.subdomain || '');
      
      // If address is specified, also match by address
      let addressMatch = true;
      if (record.address) {
        addressMatch = existingRecord.address === record.address;
      }
      
      const isMatch = typeMatch && subdomainMatch && addressMatch;
      
      if (isMatch) {
        recordFound = true;
        return false; // Filter out this record
      }
      return true; // Keep this record
    });
    
    if (!recordFound) {
      return res.status(404).json({
        success: false,
        error: 'Record to delete not found',
        searchCriteria: record,
        availableRecords: existingRecords,
        timestamp: new Date().toISOString()
      });
    }
    
    // Step 3: Update DNS zone with remaining records
    const updateResult = await req.opensrsClient.setDnsZone(domain, remainingRecords);
    
    if (updateResult.success) {
      res.json({
        success: true,
        message: 'DNS record deleted successfully',
        data: {
          domain: domain,
          deletedRecord: record,
          remainingRecords: remainingRecords.length,
          originalRecords: existingRecords.length
        },
        responseCode: updateResult.responseCode,
        responseText: updateResult.responseText,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: updateResult.error || 'Failed to delete DNS record',
        responseCode: updateResult.responseCode,
        responseText: updateResult.responseText,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('DNS record deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/manage-record', async (req, res) => {
  try {
    const { domain, record, action, oldRecord } = req.body;
    
    if (!domain || !record || !action) {
      return res.status(400).json({
        success: false,
        error: 'Domain, record, and action are required',
        timestamp: new Date().toISOString()
      });
    }

    if (!['add', 'update', 'delete'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be one of: add, update, delete',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'update' && !oldRecord) {
      return res.status(400).json({
        success: false,
        error: 'oldRecord is required for update action',
        timestamp: new Date().toISOString()
      });
    }

    
    const workflow = {
      step1_retrieve: null,
      step2_prepare: null,
      step3_merge: null,
      step4_update: null,
      step5_confirm: null
    };
    
    // Step 1: Retrieve existing DNS records
    workflow.step1_retrieve = { timestamp: new Date().toISOString() };
    
    const existingZone = await req.opensrsClient.getDnsZone(domain);
    
    if (!existingZone.success) {
      workflow.step1_retrieve.success = false;
      workflow.step1_retrieve.error = existingZone.error;
      
      return res.status(500).json({
        success: false,
        error: 'Step 1 failed: Could not retrieve existing DNS records',
        workflow: workflow,
        timestamp: new Date().toISOString()
      });
    }
    
    const existingRecords = existingZone.data.records || [];
    workflow.step1_retrieve.success = true;
    workflow.step1_retrieve.recordCount = existingRecords.length;
    workflow.step1_retrieve.records = existingRecords;
    
    
    // Step 2: Prepare new record
    workflow.step2_prepare = { timestamp: new Date().toISOString(), action: action };
    
    let preparedRecord = { ...record };
    if (!preparedRecord.ttl) {
      preparedRecord.ttl = 3600;
    }
    
    workflow.step2_prepare.success = true;
    workflow.step2_prepare.record = preparedRecord;
    
    
    // Step 3: Merge/modify records based on action
    workflow.step3_merge = { timestamp: new Date().toISOString(), action: action };
    
    let finalRecords = [];
    let recordFound = false;
    
    switch (action) {
      case 'add':
        finalRecords = [...existingRecords, preparedRecord];
        workflow.step3_merge.operation = 'Added new record to existing set';
        workflow.step3_merge.success = true;
        break;
        
      case 'update':
        finalRecords = existingRecords.map(existingRecord => {
          const typeMatch = existingRecord.type === oldRecord.type;
          const subdomainMatch = (existingRecord.subdomain || '') === (oldRecord.subdomain || '');
          const addressMatch = !oldRecord.address || existingRecord.address === oldRecord.address;
          
          if (typeMatch && subdomainMatch && addressMatch) {
            recordFound = true;
            return preparedRecord;
          }
          return existingRecord;
        });
        
        if (!recordFound) {
          workflow.step3_merge.success = false;
          workflow.step3_merge.error = 'Record to update not found';
          
          return res.status(404).json({
            success: false,
            error: 'Step 3 failed: Record to update not found',
            searchCriteria: oldRecord,
            workflow: workflow,
            timestamp: new Date().toISOString()
          });
        }
        
        workflow.step3_merge.operation = 'Replaced existing record with updated version';
        workflow.step3_merge.success = true;
        break;
        
      case 'delete':
        finalRecords = existingRecords.filter(existingRecord => {
          const typeMatch = existingRecord.type === record.type;
          const subdomainMatch = (existingRecord.subdomain || '') === (record.subdomain || '');
          const addressMatch = !record.address || existingRecord.address === record.address;
          
          const isMatch = typeMatch && subdomainMatch && addressMatch;
          if (isMatch) {
            recordFound = true;
            return false; // Remove this record
          }
          return true; // Keep this record
        });
        
        if (!recordFound) {
          workflow.step3_merge.success = false;
          workflow.step3_merge.error = 'Record to delete not found';
          
          return res.status(404).json({
            success: false,
            error: 'Step 3 failed: Record to delete not found',
            searchCriteria: record,
            workflow: workflow,
            timestamp: new Date().toISOString()
          });
        }
        
        workflow.step3_merge.operation = 'Removed specified record from set';
        workflow.step3_merge.success = true;
        break;
    }
    
    workflow.step3_merge.originalCount = existingRecords.length;
    workflow.step3_merge.finalCount = finalRecords.length;
    
    
    // Step 4: Update DNS zone
    workflow.step4_update = { timestamp: new Date().toISOString() };
    
    const updateResult = await req.opensrsClient.setDnsZone(domain, finalRecords);
    
    if (!updateResult.success) {
      workflow.step4_update.success = false;
      workflow.step4_update.error = updateResult.error;
      workflow.step4_update.responseCode = updateResult.responseCode;
      
      return res.status(500).json({
        success: false,
        error: 'Step 4 failed: Could not update DNS zone',
        workflow: workflow,
        timestamp: new Date().toISOString()
      });
    }
    
    workflow.step4_update.success = true;
    workflow.step4_update.responseCode = updateResult.responseCode;
    workflow.step4_update.responseText = updateResult.responseText;
    
    
    // Step 5: Confirm operation
    workflow.step5_confirm = { 
      timestamp: new Date().toISOString(),
      success: true,
      operation: `${action} operation completed successfully`,
      finalRecordCount: finalRecords.length
    };
    
    
    // Return comprehensive response
    res.json({
      success: true,
      message: `DNS record ${action} completed successfully using complete 5-step workflow`,
      data: {
        domain: domain,
        action: action,
        record: preparedRecord,
        ...(action === 'update' && { oldRecord: oldRecord }),
        finalRecordCount: finalRecords.length,
        originalRecordCount: existingRecords.length
      },
      workflow: workflow,
      responseCode: updateResult.responseCode,
      responseText: updateResult.responseText,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('DNS record management error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      workflow: workflow || {},
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/create-zone', async (req, res) => {
  try {
    const { domain, records = [] } = req.body;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Domain is required',
        timestamp: new Date().toISOString()
      });
    }

    
    const result = await req.opensrsClient.createDnsZone(domain, records);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'DNS zone created successfully',
        data: {
          domain: domain,
          recordCount: records.length,
          records: records
        },
        responseCode: result.responseCode,
        responseText: result.responseText,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to create DNS zone',
        responseCode: result.responseCode,
        responseText: result.responseText,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('DNS zone creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/delete-zone/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Domain is required',
        timestamp: new Date().toISOString()
      });
    }

    
    const result = await req.opensrsClient.deleteDnsZone(domain);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'DNS zone deleted successfully',
        data: {
          domain: domain
        },
        responseCode: result.responseCode,
        responseText: result.responseText,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to delete DNS zone',
        responseCode: result.responseCode,
        responseText: result.responseText,
        timestamp: new Date().toISOString()
      });
    }
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
