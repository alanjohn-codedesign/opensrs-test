# Frontend API Integration Guide

This guide provides comprehensive documentation for frontend developers to integrate with the OpenSRS Domain Management API.

## 🌐 Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3001/api
```

## 📋 Table of Contents

1. [DNS Management APIs](#dns-management-apis)
2. [Domain APIs](#domain-apis)
3. [Registration APIs](#registration-apis)
4. [Nameserver APIs](#nameserver-apis)
5. [Error Handling](#error-handling)
6. [Frontend Examples](#frontend-examples)

---

## 🔧 DNS Management APIs

### Get DNS Zone Records

**Endpoint:** `GET /api/dns/get-zone/{domain}`

**Description:** Retrieve all DNS records for a domain.

```javascript
// Fetch DNS records
const getDnsRecords = async (domain) => {
  try {
    const response = await fetch(`/api/dns/get-zone/${domain}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data.records;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to fetch DNS records:', error);
    throw error;
  }
};
```

**Response Example:**
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
        "priority": 10,
        "ttl": 3600
      }
    ],
    "recordCount": 2
  },
  "responseCode": "200",
  "responseText": "Command completed successfully",
  "timestamp": "2025-01-16T10:30:00.000Z"
}
```

### Add DNS Record

**Endpoint:** `POST /api/dns/add-record`

**Description:** Add a new DNS record while preserving existing ones.

```javascript
// Add a new DNS record
const addDnsRecord = async (domain, record) => {
  try {
    const response = await fetch('/api/dns/add-record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: domain,
        record: record
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to add DNS record:', error);
    throw error;
  }
};

// Usage example
const newRecord = {
  type: "A",
  subdomain: "api",
  address: "203.0.113.1",
  ttl: 3600
};

addDnsRecord("example.com", newRecord);
```

**Request Body:**
```json
{
  "domain": "example.com",
  "record": {
    "type": "A",
    "subdomain": "api",
    "address": "203.0.113.1",
    "ttl": 3600
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "DNS record added successfully",
  "data": {
    "domain": "example.com",
    "newRecord": {
      "type": "A",
      "subdomain": "api",
      "address": "203.0.113.1",
      "ttl": 3600
    },
    "totalRecords": 3,
    "existingRecords": 2,
    "workflow": {
      "step1_retrieve": {
        "success": true,
        "recordCount": 2
      },
      "step2_merge": {
        "success": true,
        "totalRecords": 3
      },
      "step3_update": {
        "success": true,
        "responseCode": "200"
      }
    }
  },
  "timestamp": "2025-01-16T10:30:00.000Z"
}
```

### Update DNS Record

**Endpoint:** `POST /api/dns/update-record`

**Description:** Update an existing DNS record.

```javascript
// Update an existing DNS record
const updateDnsRecord = async (domain, oldRecord, newRecord) => {
  try {
    const response = await fetch('/api/dns/update-record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: domain,
        oldRecord: oldRecord,
        newRecord: newRecord
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to update DNS record:', error);
    throw error;
  }
};
```

**Request Body:**
```json
{
  "domain": "example.com",
  "oldRecord": {
    "type": "A",
    "subdomain": "api",
    "address": "203.0.113.1"
  },
  "newRecord": {
    "type": "A",
    "subdomain": "api",
    "address": "203.0.113.2",
    "ttl": 7200
  }
}
```

### Delete DNS Record

**Endpoint:** `POST /api/dns/delete-record`

**Description:** Delete a specific DNS record while preserving others.

```javascript
// Delete a DNS record
const deleteDnsRecord = async (domain, record) => {
  try {
    const response = await fetch('/api/dns/delete-record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: domain,
        record: record
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to delete DNS record:', error);
    throw error;
  }
};
```

### Complete DNS Record Management

**Endpoint:** `POST /api/dns/manage-record`

**Description:** Comprehensive DNS record management with detailed workflow tracking.

```javascript
// Manage DNS record with detailed workflow
const manageDnsRecord = async (domain, record, action, oldRecord = null) => {
  try {
    const payload = {
      domain: domain,
      record: record,
      action: action // 'add', 'update', or 'delete'
    };
    
    if (action === 'update' && oldRecord) {
      payload.oldRecord = oldRecord;
    }
    
    const response = await fetch('/api/dns/manage-record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to manage DNS record:', error);
    throw error;
  }
};

// Usage examples
manageDnsRecord("example.com", newRecord, "add");
manageDnsRecord("example.com", newRecord, "update", oldRecord);
manageDnsRecord("example.com", recordToDelete, "delete");
```

**Response Example (with detailed workflow):**
```json
{
  "success": true,
  "message": "DNS record add completed successfully using complete 5-step workflow",
  "data": {
    "domain": "example.com",
    "action": "add",
    "record": {
      "type": "A",
      "subdomain": "api",
      "address": "203.0.113.1",
      "ttl": 3600
    },
    "finalRecordCount": 3,
    "originalRecordCount": 2
  },
  "workflow": {
    "step1_retrieve": {
      "timestamp": "2025-01-16T10:30:00.000Z",
      "success": true,
      "recordCount": 2,
      "records": [...]
    },
    "step2_prepare": {
      "timestamp": "2025-01-16T10:30:01.000Z",
      "action": "add",
      "success": true,
      "record": {...}
    },
    "step3_merge": {
      "timestamp": "2025-01-16T10:30:02.000Z",
      "action": "add",
      "operation": "Added new record to existing set",
      "success": true,
      "originalCount": 2,
      "finalCount": 3
    },
    "step4_update": {
      "timestamp": "2025-01-16T10:30:03.000Z",
      "success": true,
      "responseCode": "200",
      "responseText": "Command completed successfully"
    },
    "step5_confirm": {
      "timestamp": "2025-01-16T10:30:04.000Z",
      "success": true,
      "operation": "add operation completed successfully",
      "finalRecordCount": 3
    }
  },
  "timestamp": "2025-01-16T10:30:04.000Z"
}
```

---

## 🌍 Domain APIs

### Domain Lookup

**Endpoint:** `GET /api/domains/lookup/{domain}`

**Description:** Check if a domain is available for registration.

```javascript
// Check domain availability
const checkDomainAvailability = async (domain) => {
  try {
    const response = await fetch(`/api/domains/lookup/${domain}`);
    const data = await response.json();
    
    if (data.success) {
      return {
        domain: domain,
        available: data.data.status === 'available',
        status: data.data.status
      };
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to check domain availability:', error);
    throw error;
  }
};
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "status": "available"
  },
  "responseCode": "200",
  "responseText": "Command completed successfully",
  "timestamp": "2025-01-16T10:30:00.000Z"
}
```

### Domain Pricing

**Endpoint:** `GET /api/domains/price/{domain}`

**Description:** Get pricing information for a domain.

```javascript
// Get domain pricing
const getDomainPrice = async (domain) => {
  try {
    const response = await fetch(`/api/domains/price/${domain}`);
    const data = await response.json();
    
    if (data.success) {
      return {
        domain: domain,
        price: data.data.price,
        currency: data.data.currency
      };
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to get domain price:', error);
    throw error;
  }
};
```

### Domain Search with Suggestions

**Endpoint:** `POST /api/domains/search`

**Description:** Search for domains with suggestions and pricing.

```javascript
// Search domains with suggestions
const searchDomains = async (searchQuery) => {
  try {
    const response = await fetch('/api/domains/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search_query: searchQuery
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data.suggestions;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to search domains:', error);
    throw error;
  }
};
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "search_query": "mycompany",
    "suggestions": [
      {
        "domain": "mycompany.com",
        "availability": "available",
        "price": 12.99,
        "currency": "USD"
      },
      {
        "domain": "mycompany.net",
        "availability": "available",
        "price": 14.99,
        "currency": "USD"
      }
    ],
    "stats": {
      "total_checked": 10,
      "available_count": 5,
      "processing_time_ms": 2340
    }
  }
}
```

---

## 📝 Registration APIs

### Register Domain

**Endpoint:** `POST /api/registration/register`

**Description:** Register a new domain.

```javascript
// Register a domain
const registerDomain = async (registrationData) => {
  try {
    const response = await fetch('/api/registration/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to register domain:', error);
    throw error;
  }
};

// Usage example
const registrationData = {
  domain: "example.com",
  reg_type: "new",
  reg_username: "user123",
  reg_password: "securepassword",
  period: 1,
  contact_set: {
    owner: {
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      phone: "+1.5551234567",
      address1: "123 Main St",
      city: "Anytown",
      state: "CA",
      postal_code: "12345",
      country: "US"
    }
  }
};

registerDomain(registrationData);
```

---

## 🖥️ Nameserver APIs

### Update Nameservers

**Endpoint:** `POST /api/nameservers/update`

**Description:** Update nameservers for a domain.

```javascript
// Update domain nameservers
const updateNameservers = async (domain, nameservers, opType = 'assign') => {
  try {
    const response = await fetch('/api/nameservers/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: domain,
        op_type: opType,
        nameservers: nameservers
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to update nameservers:', error);
    throw error;
  }
};

// Usage example
const nameservers = [
  { name: "ns1.example.com", ip: "192.0.2.1" },
  { name: "ns2.example.com", ip: "192.0.2.2" }
];

updateNameservers("example.com", nameservers);
```

---

## ⚠️ Error Handling

### Standard Error Response Format

All API endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error description",
  "responseCode": "400",
  "responseText": "Invalid request parameters",
  "timestamp": "2025-01-16T10:30:00.000Z"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (domain/record not found)
- `500` - Internal Server Error

### Frontend Error Handling Pattern

```javascript
// Recommended error handling pattern
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }
    
    if (!data.success) {
      throw new Error(data.error || 'API returned unsuccessful response');
    }
    
    return data;
  } catch (error) {
    // Log error for debugging
    console.error('API Error:', error);
    
    // Re-throw for component handling
    throw error;
  }
};
```

---

## 🎨 Frontend Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const DnsManager = ({ domain }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch DNS records
  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dns/get-zone/${domain}`);
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.data.records);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch DNS records');
    } finally {
      setLoading(false);
    }
  };

  // Add new record
  const addRecord = async (newRecord) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dns/add-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, record: newRecord })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchRecords(); // Refresh the list
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to add DNS record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (domain) {
      fetchRecords();
    }
  }, [domain]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>DNS Records for {domain}</h3>
      <ul>
        {records.map((record, index) => (
          <li key={index}>
            {record.type} {record.subdomain || '@'} → {record.address}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### Vue.js Component Example

```vue
<template>
  <div class="dns-manager">
    <h3>DNS Records for {{ domain }}</h3>
    
    <div v-if="loading">Loading...</div>
    <div v-if="error" class="error">Error: {{ error }}</div>
    
    <div v-if="records.length">
      <ul>
        <li v-for="(record, index) in records" :key="index">
          {{ record.type }} {{ record.subdomain || '@' }} → {{ record.address }}
        </li>
      </ul>
    </div>
    
    <button @click="addSampleRecord">Add Sample A Record</button>
  </div>
</template>

<script>
export default {
  props: ['domain'],
  data() {
    return {
      records: [],
      loading: false,
      error: null
    };
  },
  methods: {
    async fetchRecords() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await fetch(`/api/dns/get-zone/${this.domain}`);
        const data = await response.json();
        
        if (data.success) {
          this.records = data.data.records;
        } else {
          this.error = data.error;
        }
      } catch (err) {
        this.error = 'Failed to fetch DNS records';
      } finally {
        this.loading = false;
      }
    },
    
    async addSampleRecord() {
      const newRecord = {
        type: 'A',
        subdomain: 'test',
        address: '203.0.113.1',
        ttl: 3600
      };
      
      this.loading = true;
      this.error = null;
      
      try {
        const response = await fetch('/api/dns/add-record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: this.domain, record: newRecord })
        });
        
        const data = await response.json();
        
        if (data.success) {
          await this.fetchRecords();
        } else {
          this.error = data.error;
        }
      } catch (err) {
        this.error = 'Failed to add DNS record';
      } finally {
        this.loading = false;
      }
    }
  },
  
  watch: {
    domain: {
      immediate: true,
      handler(newDomain) {
        if (newDomain) {
          this.fetchRecords();
        }
      }
    }
  }
};
</script>
```

### Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>DNS Manager</title>
</head>
<body>
    <div id="app">
        <h2>DNS Record Manager</h2>
        <input type="text" id="domainInput" placeholder="Enter domain name">
        <button onclick="loadRecords()">Load Records</button>
        
        <div id="loading" style="display: none;">Loading...</div>
        <div id="error" style="display: none; color: red;"></div>
        <div id="records"></div>
        
        <h3>Add New Record</h3>
        <form onsubmit="addRecord(event)">
            <input type="text" id="subdomain" placeholder="Subdomain">
            <select id="recordType">
                <option value="A">A</option>
                <option value="CNAME">CNAME</option>
                <option value="MX">MX</option>
                <option value="TXT">TXT</option>
            </select>
            <input type="text" id="address" placeholder="Address/Value" required>
            <input type="number" id="ttl" placeholder="TTL" value="3600">
            <button type="submit">Add Record</button>
        </form>
    </div>

    <script>
        let currentDomain = '';

        async function loadRecords() {
            const domain = document.getElementById('domainInput').value.trim();
            if (!domain) return;
            
            currentDomain = domain;
            showLoading(true);
            hideError();
            
            try {
                const response = await fetch(`/api/dns/get-zone/${domain}`);
                const data = await response.json();
                
                if (data.success) {
                    displayRecords(data.data.records);
                } else {
                    showError(data.error);
                }
            } catch (error) {
                showError('Failed to load records: ' + error.message);
            } finally {
                showLoading(false);
            }
        }

        async function addRecord(event) {
            event.preventDefault();
            
            if (!currentDomain) {
                showError('Please load a domain first');
                return;
            }
            
            const record = {
                type: document.getElementById('recordType').value,
                subdomain: document.getElementById('subdomain').value,
                address: document.getElementById('address').value,
                ttl: parseInt(document.getElementById('ttl').value) || 3600
            };
            
            showLoading(true);
            hideError();
            
            try {
                const response = await fetch('/api/dns/add-record', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ domain: currentDomain, record })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('subdomain').value = '';
                    document.getElementById('address').value = '';
                    loadRecords(); // Refresh the list
                } else {
                    showError(data.error);
                }
            } catch (error) {
                showError('Failed to add record: ' + error.message);
            } finally {
                showLoading(false);
            }
        }

        function displayRecords(records) {
            const container = document.getElementById('records');
            if (records.length === 0) {
                container.innerHTML = '<p>No DNS records found.</p>';
                return;
            }
            
            const html = records.map(record => `
                <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0;">
                    <strong>${record.type}</strong> 
                    ${record.subdomain || '@'} → ${record.address}
                    ${record.ttl ? ` (TTL: ${record.ttl})` : ''}
                </div>
            `).join('');
            
            container.innerHTML = html;
        }

        function showLoading(show) {
            document.getElementById('loading').style.display = show ? 'block' : 'none';
        }

        function showError(message) {
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }

        function hideError() {
            document.getElementById('error').style.display = 'none';
        }
    </script>
</body>
</html>
```

---

## 📚 DNS Record Types Reference

### Supported Record Types

| Type | Description | Required Fields | Example |
|------|-------------|----------------|---------|
| A | IPv4 Address | `type`, `address` | `{ "type": "A", "subdomain": "www", "address": "192.0.2.1" }` |
| AAAA | IPv6 Address | `type`, `address` | `{ "type": "AAAA", "subdomain": "www", "address": "2001:db8::1" }` |
| CNAME | Canonical Name | `type`, `address` | `{ "type": "CNAME", "subdomain": "www", "address": "example.com" }` |
| MX | Mail Exchange | `type`, `address`, `priority` | `{ "type": "MX", "address": "mail.example.com", "priority": 10 }` |
| TXT | Text Record | `type`, `address` | `{ "type": "TXT", "address": "v=spf1 include:_spf.google.com ~all" }` |
| SRV | Service Record | `type`, `address`, `priority`, `weight`, `port` | `{ "type": "SRV", "address": "target.example.com", "priority": 10, "weight": 5, "port": 443 }` |

### Common Field Descriptions

- `type`: Record type (A, AAAA, CNAME, MX, TXT, SRV)
- `subdomain`: Subdomain name (empty string for root domain)
- `address`: Target address or value
- `ttl`: Time to live in seconds (default: 3600)
- `priority`: Priority value (for MX and SRV records)
- `weight`: Weight value (for SRV records)
- `port`: Port number (for SRV records)

This documentation provides everything frontend developers need to integrate with your DNS management API successfully! 🚀
