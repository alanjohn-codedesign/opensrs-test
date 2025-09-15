# OpenSRS API Examples

This document provides practical examples for common use cases with the OpenSRS API integration.

## Table of Contents

- [Basic Domain Operations](#basic-domain-operations)
- [DNS Management](#dns-management)
- [Domain Modification](#domain-modification)
- [Complete Workflows](#complete-workflows)
- [Error Handling](#error-handling)
- [Advanced Examples](#advanced-examples)

## Basic Domain Operations

### Search for Available Domains

```bash
# Search for domain suggestions
curl -X POST http://localhost:3000/api/domains/search \
  -H "Content-Type: application/json" \
  -d '{
    "search_query": "mycompany"
  }'
```

**Response:**
```json
{
  "search_query": "mycompany",
  "suggestions": [
    {
      "domain": "mycompany.com",
      "availability": "available",
      "price": 11.50,
      "currency": "USD"
    },
    {
      "domain": "mycompany.net",
      "availability": "available",
      "price": 12.00,
      "currency": "USD"
    }
  ],
  "stats": {
    "total_checked": 10,
    "available_count": 2,
    "processing_time_ms": 1500
  }
}
```

### Check Single Domain Availability

```bash
# Check if a specific domain is available
curl -X POST http://localhost:3000/api/domains/lookup \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mycompany.com"
  }'
```

### Get Domain Pricing

```bash
# Get price for a specific domain
curl http://localhost:3000/api/domains/mycompany.com/price
```

### Get Domain Suggestions

```bash
# Get alternative domain suggestions
curl -X POST http://localhost:3000/api/domains/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "search_string": "tech"
  }'
```

## DNS Management

### Create DNS Zone with Initial Records

```bash
# Create a DNS zone with basic records
curl -X POST http://localhost:3000/api/dns/create-zone \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mycompany.com",
    "records": [
      {
        "type": "A",
        "subdomain": "",
        "address": "192.168.1.100",
        "ttl": 3600
      },
      {
        "type": "A",
        "subdomain": "www",
        "address": "192.168.1.100",
        "ttl": 3600
      },
      {
        "type": "MX",
        "subdomain": "",
        "address": "mail.mycompany.com",
        "priority": 10,
        "ttl": 3600
      }
    ]
  }'
```

### Add Individual DNS Records

```bash
# Add an A record
curl -X POST http://localhost:3000/api/dns/add-record \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mycompany.com",
    "record": {
      "type": "A",
      "host": "api",
      "value": "192.168.1.101",
      "ttl": 3600
    }
  }'

# Add a CNAME record
curl -X POST http://localhost:3000/api/dns/add-record \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mycompany.com",
    "record": {
      "type": "CNAME",
      "host": "blog",
      "value": "mycompany.com",
      "ttl": 3600
    }
  }'

# Add a TXT record for SPF
curl -X POST http://localhost:3000/api/dns/add-record \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mycompany.com",
    "record": {
      "type": "TXT",
      "host": "",
      "value": "v=spf1 include:_spf.google.com ~all",
      "ttl": 3600
    }
  }'
```

### Update DNS Records

```bash
# Update an existing A record
curl -X POST http://localhost:3000/api/dns/update-record \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mycompany.com",
    "record": {
      "type": "A",
      "host": "www",
      "value": "192.168.1.200",
      "ttl": 3600
    }
  }'
```

### Get All DNS Records

```bash
# Retrieve all DNS records for a domain
curl http://localhost:3000/api/dns/get-zone/mycompany.com
```

### Replace All DNS Records

```bash
# Replace all DNS records (use with caution)
curl -X POST http://localhost:3000/api/dns/set-zone \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mycompany.com",
    "records": [
      {
        "type": "A",
        "subdomain": "",
        "address": "192.168.1.100",
        "ttl": 3600
      },
      {
        "type": "A",
        "subdomain": "www",
        "address": "192.168.1.100",
        "ttl": 3600
      }
    ]
  }'
```

## Domain Modification

### Enable Auto-Renewal

```bash
# Enable auto-renewal and disable let-expire
curl -X PUT http://localhost:3000/api/domains/mycompany.com/autorenew \
  -H "Content-Type: application/json" \
  -d '{
    "autoRenew": true,
    "letExpire": false
  }'
```

### Disable Auto-Renewal

```bash
# Disable auto-renewal and enable let-expire
curl -X PUT http://localhost:3000/api/domains/mycompany.com/autorenew \
  -H "Content-Type: application/json" \
  -d '{
    "autoRenew": false,
    "letExpire": true
  }'
```

### Enable WHOIS Privacy

```bash
# Enable WHOIS privacy protection
curl -X PUT http://localhost:3000/api/domains/mycompany.com/whois-privacy \
  -H "Content-Type: application/json" \
  -d '{
    "state": "enable"
  }'
```

### Disable WHOIS Privacy

```bash
# Disable WHOIS privacy protection
curl -X PUT http://localhost:3000/api/domains/mycompany.com/whois-privacy \
  -H "Content-Type: application/json" \
  -d '{
    "state": "disable"
  }'
```

## Complete Workflows

### 1. New Domain Setup Workflow

```bash
#!/bin/bash

DOMAIN="mycompany.com"
IP_ADDRESS="192.168.1.100"

echo "Setting up domain: $DOMAIN"

# 1. Check domain availability
echo "Checking domain availability..."
curl -X POST http://localhost:3000/api/domains/lookup \
  -H "Content-Type: application/json" \
  -d "{\"domain\": \"$DOMAIN\"}"

# 2. Get domain pricing
echo "Getting domain pricing..."
curl http://localhost:3000/api/domains/$DOMAIN/price

# 3. Create DNS zone
echo "Creating DNS zone..."
curl -X POST http://localhost:3000/api/dns/create-zone \
  -H "Content-Type: application/json" \
  -d "{
    \"domain\": \"$DOMAIN\",
    \"records\": [
      {
        \"type\": \"A\",
        \"subdomain\": \"\",
        \"address\": \"$IP_ADDRESS\",
        \"ttl\": 3600
      },
      {
        \"type\": \"A\",
        \"subdomain\": \"www\",
        \"address\": \"$IP_ADDRESS\",
        \"ttl\": 3600
      }
    ]
  }"

# 4. Enable auto-renewal
echo "Enabling auto-renewal..."
curl -X PUT http://localhost:3000/api/domains/$DOMAIN/autorenew \
  -H "Content-Type: application/json" \
  -d '{"autoRenew": true, "letExpire": false}'

# 5. Enable WHOIS privacy
echo "Enabling WHOIS privacy..."
curl -X PUT http://localhost:3000/api/domains/$DOMAIN/whois-privacy \
  -H "Content-Type: application/json" \
  -d '{"state": "enable"}'

echo "Domain setup complete!"
```

### 2. Email Server Setup

```bash
#!/bin/bash

DOMAIN="mycompany.com"
MAIL_SERVER="mail.mycompany.com"

echo "Setting up email for domain: $DOMAIN"

# 1. Add MX record
echo "Adding MX record..."
curl -X POST http://localhost:3000/api/dns/add-record \
  -H "Content-Type: application/json" \
  -d "{
    \"domain\": \"$DOMAIN\",
    \"record\": {
      \"type\": \"MX\",
      \"host\": \"\",
      \"value\": \"$MAIL_SERVER\",
      \"priority\": 10,
      \"ttl\": 3600
    }
  }"

# 2. Add SPF record
echo "Adding SPF record..."
curl -X POST http://localhost:3000/api/dns/add-record \
  -H "Content-Type: application/json" \
  -d "{
    \"domain\": \"$DOMAIN\",
    \"record\": {
      \"type\": \"TXT\",
      \"host\": \"\",
      \"value\": \"v=spf1 include:$MAIL_SERVER ~all\",
      \"ttl\": 3600
    }
  }"

# 3. Add DKIM record (example)
echo "Adding DKIM record..."
curl -X POST http://localhost:3000/api/dns/add-record \
  -H "Content-Type: application/json" \
  -d "{
    \"domain\": \"$DOMAIN\",
    \"record\": {
      \"type\": \"TXT\",
      \"host\": \"default._domainkey\",
      \"value\": \"v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...\",
      \"ttl\": 3600
    }
  }"

echo "Email setup complete!"
```

### 3. Load Balancer Setup

```bash
#!/bin/bash

DOMAIN="mycompany.com"
SERVER1="192.168.1.100"
SERVER2="192.168.1.101"
SERVER3="192.168.1.102"

echo "Setting up load balancer for domain: $DOMAIN"

# Add multiple A records for load balancing
for i in 1 2 3; do
  SERVER_IP="SERVER$i"
  echo "Adding server $i: ${!SERVER_IP}"
  
  curl -X POST http://localhost:3000/api/dns/add-record \
    -H "Content-Type: application/json" \
    -d "{
      \"domain\": \"$DOMAIN\",
      \"record\": {
        \"type\": \"A\",
        \"host\": \"www\",
        \"value\": \"${!SERVER_IP}\",
        \"ttl\": 300
      }
    }"
done

echo "Load balancer setup complete!"
```

## Error Handling

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

async function addDnsRecord(domain, record) {
  try {
    const response = await axios.post('http://localhost:3000/api/dns/add-record', {
      domain,
      record
    });
    
    if (response.data.success) {
      console.log('DNS record added successfully:', response.data);
      return response.data;
    } else {
      throw new Error(`API Error: ${response.data.error}`);
    }
  } catch (error) {
    if (error.response) {
      // API returned an error response
      console.error('API Error:', error.response.data);
      throw new Error(`API Error: ${error.response.data.error}`);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.message);
      throw new Error('Network Error: Unable to connect to API');
    } else {
      // Something else happened
      console.error('Error:', error.message);
      throw error;
    }
  }
}

// Usage
addDnsRecord('mycompany.com', {
  type: 'A',
  host: 'api',
  value: '192.168.1.100',
  ttl: 3600
}).then(result => {
  console.log('Success:', result);
}).catch(error => {
  console.error('Failed:', error.message);
});
```

### Python Example

```python
import requests
import json

def add_dns_record(domain, record):
    url = 'http://localhost:3000/api/dns/add-record'
    data = {
        'domain': domain,
        'record': record
    }
    
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        
        result = response.json()
        if result['success']:
            print('DNS record added successfully:', result)
            return result
        else:
            raise Exception(f"API Error: {result['error']}")
            
    except requests.exceptions.RequestException as e:
        print(f'Network Error: {e}')
        raise
    except Exception as e:
        print(f'Error: {e}')
        raise

# Usage
try:
    result = add_dns_record('mycompany.com', {
        'type': 'A',
        'host': 'api',
        'value': '192.168.1.100',
        'ttl': 3600
    })
    print('Success:', result)
except Exception as e:
    print('Failed:', str(e))
```

## Advanced Examples

### 1. Bulk Domain Operations

```bash
#!/bin/bash

DOMAINS=("company1.com" "company2.com" "company3.com")
IP_ADDRESS="192.168.1.100"

for domain in "${DOMAINS[@]}"; do
  echo "Processing domain: $domain"
  
  # Check availability
  curl -X POST http://localhost:3000/api/domains/lookup \
    -H "Content-Type: application/json" \
    -d "{\"domain\": \"$domain\"}"
  
  # Create DNS zone
  curl -X POST http://localhost:3000/api/dns/create-zone \
    -H "Content-Type: application/json" \
    -d "{
      \"domain\": \"$domain\",
      \"records\": [
        {
          \"type\": \"A\",
          \"subdomain\": \"\",
          \"address\": \"$IP_ADDRESS\",
          \"ttl\": 3600
        }
      ]
    }"
  
  echo "Completed: $domain"
done
```

### 2. DNS Record Migration

```bash
#!/bin/bash

SOURCE_DOMAIN="oldcompany.com"
TARGET_DOMAIN="newcompany.com"

echo "Migrating DNS records from $SOURCE_DOMAIN to $TARGET_DOMAIN"

# 1. Get all records from source domain
echo "Getting records from source domain..."
SOURCE_RECORDS=$(curl -s http://localhost:3000/api/dns/get-zone/$SOURCE_DOMAIN | jq '.data.records')

# 2. Create zone for target domain
echo "Creating zone for target domain..."
curl -X POST http://localhost:3000/api/dns/create-zone \
  -H "Content-Type: application/json" \
  -d "{
    \"domain\": \"$TARGET_DOMAIN\",
    \"records\": $SOURCE_RECORDS
  }"

echo "Migration complete!"
```

### 3. Health Check Script

```bash
#!/bin/bash

API_URL="http://localhost:3000"
DOMAIN="mycompany.com"

echo "Running health checks..."

# 1. Check API health
echo "Checking API health..."
curl -s $API_URL/health | jq '.'

# 2. Check domain lookup
echo "Checking domain lookup..."
curl -s -X POST $API_URL/api/domains/lookup \
  -H "Content-Type: application/json" \
  -d "{\"domain\": \"$DOMAIN\"}" | jq '.'

# 3. Check DNS zone
echo "Checking DNS zone..."
curl -s $API_URL/api/dns/get-zone/$DOMAIN | jq '.'

# 4. Check cache stats
echo "Checking cache stats..."
curl -s $API_URL/api/domains/cache/stats | jq '.'

echo "Health checks complete!"
```

## Testing with cURL

### Test All Endpoints

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"
DOMAIN="testdomain.com"

echo "Testing OpenSRS API endpoints..."

# Domain search
echo "1. Testing domain search..."
curl -X POST $BASE_URL/domains/search \
  -H "Content-Type: application/json" \
  -d '{"search_query": "test"}'

# Domain lookup
echo "2. Testing domain lookup..."
curl -X POST $BASE_URL/domains/lookup \
  -H "Content-Type: application/json" \
  -d "{\"domain\": \"$DOMAIN\"}"

# Domain price
echo "3. Testing domain price..."
curl $BASE_URL/domains/$DOMAIN/price

# Create DNS zone
echo "4. Testing DNS zone creation..."
curl -X POST $BASE_URL/dns/create-zone \
  -H "Content-Type: application/json" \
  -d "{
    \"domain\": \"$DOMAIN\",
    \"records\": [
      {
        \"type\": \"A\",
        \"subdomain\": \"\",
        \"address\": \"192.168.1.100\",
        \"ttl\": 3600
      }
    ]
  }"

# Add DNS record
echo "5. Testing DNS record addition..."
curl -X POST $BASE_URL/dns/add-record \
  -H "Content-Type: application/json" \
  -d "{
    \"domain\": \"$DOMAIN\",
    \"record\": {
      \"type\": \"A\",
      \"host\": \"www\",
      \"value\": \"192.168.1.100\",
      \"ttl\": 3600
    }
  }"

# Auto-renew settings
echo "6. Testing auto-renew settings..."
curl -X PUT $BASE_URL/domains/$DOMAIN/autorenew \
  -H "Content-Type: application/json" \
  -d '{"autoRenew": true, "letExpire": false}'

# WHOIS privacy
echo "7. Testing WHOIS privacy..."
curl -X PUT $BASE_URL/domains/$DOMAIN/whois-privacy \
  -H "Content-Type: application/json" \
  -d '{"state": "enable"}'

echo "All tests completed!"
```

These examples should help you get started with the OpenSRS API integration. Modify the domain names, IP addresses, and other parameters to match your specific use case.
