# DNS Record Management Workflow Implementation

## Overview

This document describes the complete implementation of the DNS record management workflow using OpenSRS APIs, following the exact 5-step process outlined in the OpenSRS documentation.

## Workflow Steps

### Step 1: Retrieve Existing DNS Records
**Objective**: Fetch the current DNS records for the domain using the `get_dns_zone` API.

**API Endpoint**: `GET /api/dns/get-zone/{domain}`

**Example Request**:
```http
GET http://localhost:3001/api/dns/get-zone/example.com
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "domain": "example.com",
    "records": [
      {
        "type": "A",
        "subdomain": "",
        "address": "192.0.2.1",
        "ttl": 3600
      },
      {
        "type": "MX",
        "subdomain": "",
        "address": "mail.example.com",
        "ttl": 3600,
        "priority": 10
      }
    ]
  },
  "timestamp": "2025-09-16T18:00:00Z"
}
```

### Step 2: Prepare the New Record to Add
**Objective**: Create the new DNS record you want to add.

**Example New Record**:
```json
{
  "type": "A",
  "subdomain": "www",
  "address": "203.0.113.1",
  "ttl": 3600
}
```

### Step 3: Merge the Existing and New Records
**Objective**: Combine the existing records and the new record.

**Example Merged Records**:
```json
{
  "domain": "example.com",
  "records": [
    {
      "type": "A",
      "subdomain": "",
      "address": "192.0.2.1",
      "ttl": 3600
    },
    {
      "type": "MX",
      "subdomain": "",
      "address": "mail.example.com",
      "ttl": 3600,
      "priority": 10
    },
    {
      "type": "A",
      "subdomain": "www",
      "address": "203.0.113.1",
      "ttl": 3600
    }
  ]
}
```

### Step 4: Update the DNS Zone Using set_dns_zone
**Objective**: Send the merged list of records back to OpenSRS to update the DNS zone.

**API Endpoint**: `POST /api/dns/set-zone`

**Example Request**:
```http
POST http://localhost:3001/api/dns/set-zone
Content-Type: application/json

{
  "domain": "example.com",
  "records": [
    {
      "type": "A",
      "subdomain": "",
      "address": "192.0.2.1",
      "ttl": 3600
    },
    {
      "type": "MX",
      "subdomain": "",
      "address": "mail.example.com",
      "ttl": 3600,
      "priority": 10
    },
    {
      "type": "A",
      "subdomain": "www",
      "address": "203.0.113.1",
      "ttl": 3600
    }
  ]
}
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "domain": "example.com",
    "records": [
      {
        "type": "A",
        "subdomain": "",
        "address": "192.0.2.1",
        "ttl": 3600
      },
      {
        "type": "MX",
        "subdomain": "",
        "address": "mail.example.com",
        "ttl": 3600,
        "priority": 10
      },
      {
        "type": "A",
        "subdomain": "www",
        "address": "203.0.113.1",
        "ttl": 3600
      }
    ]
  },
  "timestamp": "2025-09-16T18:00:00Z"
}
```

### Step 5: Confirm the New Record Is Added
**Objective**: Verify that the new record has been successfully added.

**Implementation**: The workflow endpoint automatically performs this step by calling `get_dns_zone` again to confirm the record was added.

## Complete Workflow Implementation

### Main Workflow Endpoint
**Endpoint**: `POST /api/dns/manage-record`

This endpoint implements all 5 steps in a single API call and provides detailed workflow information in the response.

**Example Request**:
```http
POST http://localhost:3001/api/dns/manage-record
Content-Type: application/json

{
  "domain": "example.com",
  "record": {
    "type": "A",
    "subdomain": "www",
    "address": "203.0.113.1",
    "ttl": 3600
  },
  "action": "add"
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "DNS record added successfully using complete workflow",
  "workflow": {
    "step1_retrieve": {
      "success": true,
      "recordCount": 2,
      "records": [...]
    },
    "step2_prepare": {
      "original": { "type": "A", "subdomain": "www", "address": "203.0.113.1", "ttl": 3600 },
      "normalized": { "type": "A", "subdomain": "www", "address": "203.0.113.1", "ttl": 3600 },
      "action": "add"
    },
    "step3_merge": {
      "action": "added_new",
      "originalCount": 2,
      "newCount": 3,
      "records": [...]
    },
    "step4_update": {
      "success": true,
      "responseCode": 200,
      "recordsSet": 3
    },
    "step5_confirm": {
      "success": true,
      "finalRecordCount": 3,
      "newRecordFound": true,
      "allRecords": [...]
    }
  },
  "data": {
    "domain": "example.com",
    "action": "add",
    "record": { "type": "A", "subdomain": "www", "address": "203.0.113.1", "ttl": 3600 },
    "totalRecords": 3,
    "recordAdded": true
  },
  "timestamp": "2025-09-16T18:00:00Z"
}
```

## DNS Record Removal Workflow

The implementation also includes comprehensive DNS record removal functionality following the same safe workflow pattern.

### Removal Workflow Steps

#### Step 1: Retrieve Existing DNS Records
**Objective**: Fetch the current DNS records to understand the current state.

#### Step 2: Identify the Record to Remove
**Objective**: Find matching records based on type, subdomain, and optionally address.

#### Step 3: Filter Out the Matching Record
**Objective**: Remove the target record(s) from the existing record set.

#### Step 4: Update the DNS Zone
**Objective**: Use `set_dns_zone` to update with the remaining records.

#### Step 5: Confirm the Record Is Removed
**Objective**: Verify the record no longer exists in the DNS zone.

### Single Record Removal

**Endpoint**: `POST /api/dns/remove-record`

**Example Request**:
```http
POST http://localhost:3001/api/dns/remove-record
Content-Type: application/json

{
  "domain": "example.com",
  "record": {
    "type": "A",
    "subdomain": "www",
    "address": "203.0.113.1"
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "DNS record removed successfully using complete workflow",
  "workflow": {
    "step1_retrieve": {
      "success": true,
      "recordCount": 3,
      "records": [...]
    },
    "step2_identify": {
      "targetRecord": { "type": "A", "subdomain": "www", "address": "203.0.113.1" },
      "matchingRecords": [...],
      "matchCount": 1
    },
    "step3_filter": {
      "originalCount": 3,
      "removedCount": 1,
      "newCount": 2,
      "records": [...]
    },
    "step4_update": {
      "success": true,
      "responseCode": 200,
      "recordsSet": 2
    },
    "step5_confirm": {
      "success": true,
      "finalRecordCount": 2,
      "recordRemoved": true,
      "allRecords": [...]
    }
  },
  "data": {
    "domain": "example.com",
    "removedRecord": { "type": "A", "subdomain": "www", "address": "203.0.113.1" },
    "removedCount": 1,
    "remainingRecords": 2,
    "confirmed": true
  },
  "timestamp": "2025-09-16T18:00:00Z"
}
```

### Bulk Record Removal

**Endpoint**: `POST /api/dns/remove-records`

**Example Request**:
```http
POST http://localhost:3001/api/dns/remove-records
Content-Type: application/json

{
  "domain": "example.com",
  "records": [
    {
      "type": "A",
      "subdomain": "api",
      "address": "203.0.113.2"
    },
    {
      "type": "CNAME",
      "subdomain": "www"
    }
  ]
}
```

### Removal Matching Logic

1. **Type + Subdomain + Address**: Exact match required for all three fields
2. **Type + Subdomain**: Removes first matching record if address not specified
3. **Multiple Matches**: If multiple records match and no address specified, returns error asking for address specification

### Error Handling for Removal

- **Record Not Found**: Returns list of available records for reference
- **Multiple Matches**: Requests more specific criteria (address field)
- **Domain Not Found**: Proper error messaging
- **Empty Zone**: Prevents removal attempts on domains with no records

## Alternative Endpoints

### Individual Step APIs
For developers who prefer to implement the workflow manually:

1. **Get DNS Zone**: `GET /api/dns/get-zone/{domain}`
2. **Set DNS Zone**: `POST /api/dns/set-zone`

### Record Management APIs
These endpoints use the same workflow internally but provide simpler interfaces:

1. **Add Record**: `POST /api/dns/add-record`
2. **Update Record**: `POST /api/dns/update-record`
3. **Remove Record**: `POST /api/dns/remove-record`
4. **Remove Multiple Records**: `POST /api/dns/remove-records`

### Zone Management APIs

1. **Create Zone**: `POST /api/dns/create-zone`
2. **Delete Zone**: `DELETE /api/dns/delete-zone/{domain}`
3. **Complete Workflow**: `POST /api/dns/manage-record`

## Supported DNS Record Types

- **A Records**: IPv4 addresses
- **AAAA Records**: IPv6 addresses
- **CNAME Records**: Canonical name records
- **MX Records**: Mail exchange records (with priority)
- **TXT Records**: Text records
- **SRV Records**: Service records (with priority, weight, port)

## Error Handling

The implementation includes comprehensive error handling:

- Validation of required fields
- Prevention of data loss during updates
- Detailed error messages with context
- Workflow state preservation on failure

## Key Features

1. **Data Loss Prevention**: Always retrieves existing records before updating
2. **Comprehensive Logging**: Detailed console output for debugging
3. **Flexible Input Formats**: Supports multiple field naming conventions
4. **Type-Specific Validation**: Ensures correct fields for each record type
5. **Workflow Transparency**: Complete visibility into each step of the process

## Testing

See `test.http` file for comprehensive test cases demonstrating:
- Complete workflow examples (add/update/remove)
- Individual step testing
- Various record types (A, AAAA, CNAME, MX, TXT, SRV)
- Single and bulk record removal
- Error scenarios and edge cases
- Alternative endpoints
- Practical removal scenarios (cleanup operations)

## OpenSRS Documentation References

- [DNS Zone Commands Overview](https://domains.opensrs.guide/docs/dns-zone-commands-overview)
- [get_dns_zone API](https://domains.opensrs.guide/docs/get_dns_zone)
- [set_dns_zone API](https://domains.opensrs.guide/docs/set_dns_zone)
- [create_dns_zone API](https://domains.opensrs.guide/docs/create_dns_zone)
- [delete_dns_zone API](https://domains.opensrs.guide/docs/delete_dns_zone)

## Implementation Files

- **Main Route Handler**: `src/routes/dns-routes.js`
- **OpenSRS Client**: `src/lib/opensrs-client.js`
- **XML Templates**: `src/lib/xml-templates/`
  - `get-dns-zone.js`
  - `set-dns-zone.js`
  - `create-dns-zone.js`
  - `delete-dns-zone.js`
- **Test Cases**: `test.http`
