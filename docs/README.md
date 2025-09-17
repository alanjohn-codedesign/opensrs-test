# OpenSRS API Integration Documentation

This documentation covers the complete OpenSRS API integration, including domain management, DNS zone management, and domain modification features.

## Table of Contents

- [Overview](#overview)
- [API Endpoints](#api-endpoints)
  - [Domain Management](#domain-management)
  - [DNS Zone Management](#dns-zone-management)
  - [Domain Modification](#domain-modification)
  - [Nameserver Management](#nameserver-management)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

This OpenSRS API integration provides a RESTful interface to OpenSRS services including:

- Domain search and availability checking
- Domain registration
- DNS zone management
- Domain modification (auto-renew, WHOIS privacy)
- Nameserver management
- Pricing information

## API Endpoints

### Domain Management

#### Search Domains with Suggestions
**Endpoint:** `POST /api/domains/search`

Searches for domain suggestions with availability and pricing information.

**Request Body:**
```json
{
  "search_query": "example"
}
```

**Response:**
```json
{
  "search_query": "example",
  "suggestions": [
    {
      "domain": "example.com",
      "availability": "available",
      "price": 11.50,
      "currency": "USD"
    }
  ],
  "stats": {
    "total_checked": 10,
    "available_count": 3,
    "processing_time_ms": 2500
  }
}
```

#### Check Domain Availability
**Endpoint:** `POST /api/domains/lookup`

Checks availability of a single domain.

**Request Body:**
```json
{
  "domain": "example.com"
}
```

**Response:**
```json
{
  "success": true,
  "domain": "example.com",
  "availability": "available",
  "responseCode": "200",
  "responseText": "Command completed successfully"
}
```

#### Get Domain Price
**Endpoint:** `GET /api/domains/:domain/price`

Gets pricing information for a domain.

**Response:**
```json
{
  "success": true,
  "domain": "example.com",
  "price": 11.50,
  "currency": "USD",
  "responseCode": "200",
  "responseText": "Command completed successfully"
}
```

#### Get Domain Suggestions
**Endpoint:** `POST /api/domains/suggestions`

Gets domain name suggestions.

**Request Body:**
```json
{
  "search_string": "example"
}
```

**Response:**
```json
{
  "success": true,
  "search_string": "example",
  "suggestions": ["example.com", "example.net", "example.org"],
  "responseCode": "200",
  "responseText": "Command completed successfully"
}
```

### DNS Zone Management

#### Create DNS Zone
**Endpoint:** `POST /api/dns/create-zone`

Creates a new DNS zone with initial records.

**Request Body:**
```json
{
  "domain": "example.com",
  "records": [
    {
      "type": "A",
      "subdomain": "www",
      "address": "1.2.3.4",
      "ttl": 3600
    }
  ]
}
```

#### Get DNS Zone
**Endpoint:** `GET /api/dns/get-zone/:domain`

Retrieves all DNS records for a domain.

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "type": "A",
        "subdomain": "www",
        "address": "1.2.3.4",
        "ttl": 3600
      }
    ]
  }
}
```

#### Set DNS Zone
**Endpoint:** `POST /api/dns/set-zone`

Replaces all DNS records for a domain.

**Request Body:**
```json
{
  "domain": "example.com",
  "records": [
    {
      "type": "A",
      "subdomain": "www",
      "address": "1.2.3.4",
      "ttl": 3600
    },
    {
      "type": "MX",
      "subdomain": "",
      "address": "mail.example.com",
      "priority": 10,
      "ttl": 3600
    }
  ]
}
```

#### Add DNS Record
**Endpoint:** `POST /api/dns/add-record`

Adds a single DNS record to existing zone (preserves existing records).

**Request Body:**
```json
{
  "domain": "example.com",
  "record": {
    "type": "A",
    "host": "sub",
    "value": "1.2.3.4",
    "ttl": 3600
  }
}
```

#### Update DNS Record
**Endpoint:** `POST /api/dns/update-record`

Updates an existing DNS record (preserves other records).

**Request Body:**
```json
{
  "domain": "example.com",
  "record": {
    "type": "A",
    "host": "sub",
    "value": "5.6.7.8",
    "ttl": 3600
  }
}
```

#### Delete DNS Zone
**Endpoint:** `DELETE /api/dns/delete-zone/:domain`

Deletes entire DNS zone for a domain.

### Domain Modification

#### Modify Auto-Renew Settings
**Endpoint:** `PUT /api/domains/:domain/autorenew`

Modifies domain auto-renew and expiration settings.

**Request Body:**
```json
{
  "autoRenew": true,
  "letExpire": false
}
```

**Response:**
```json
{
  "success": true,
  "domain": "example.com",
  "autoRenew": true,
  "letExpire": false,
  "responseCode": "200",
  "responseText": "Command completed successfully"
}
```

#### Modify WHOIS Privacy State
**Endpoint:** `PUT /api/domains/:domain/whois-privacy`

Enables or disables WHOIS privacy for a domain.

**Request Body:**
```json
{
  "state": "enable"
}
```

**Response:**
```json
{
  "success": true,
  "domain": "example.com",
  "whoisPrivacyState": "enable",
  "responseCode": "200",
  "responseText": "Command completed successfully"
}
```

### Nameserver Management

#### Update Domain Nameservers
**Endpoint:** `POST /api/nameservers/update`

Advanced update nameservers for domain (assign or remove).

**Request Body:**
```json
{
  "domain": "example.com",
  "op_type": "assign",
  "nameservers": ["ns1.example.com", "ns2.example.com"]
}
```

**Response:**
```json
{
  "success": true,
  "domain": "example.com",
  "operation": "assign",
  "nameservers": ["ns1.example.com", "ns2.example.com"],
  "responseCode": "200",
  "responseText": "Command completed successfully"
}
```

#### Get Nameserver Information
**Endpoint:** `GET /api/nameservers/:nameserver`

Retrieves information about a specific nameserver.

**Response:**
```json
{
  "success": true,
  "nameserver": "ns1.example.com",
  "responseCode": "200",
  "responseText": "Command completed successfully"
}
```

#### Create Nameserver
**Endpoint:** `POST /api/nameservers/create`

Creates a new nameserver.

**Request Body:**
```json
{
  "nameserver": "ns1.example.com",
  "ip_addresses": ["192.168.1.100", "192.168.1.101"]
}
```

**Response:**
```json
{
  "success": true,
  "nameserver": "ns1.example.com",
  "ip_addresses": ["192.168.1.100", "192.168.1.101"],
  "responseCode": "200",
  "responseText": "Command completed successfully"
}
```

#### Modify Nameserver
**Endpoint:** `PUT /api/nameservers/:nameserver`

Modifies an existing nameserver.

**Request Body:**
```json
{
  "ip_addresses": ["192.168.1.200", "192.168.1.201"]
}
```

**Response:**
```json
{
  "success": true,
  "nameserver": "ns1.example.com",
  "ip_addresses": ["192.168.1.200", "192.168.1.201"],
  "responseCode": "200",
  "responseText": "Command completed successfully"
}
```

#### Delete Nameserver
**Endpoint:** `DELETE /api/nameservers/:nameserver`

Deletes a nameserver.

**Response:**
```json
{
  "success": true,
  "nameserver": "ns1.example.com",
  "responseCode": "200",
  "responseText": "Command completed successfully"
}
```

#### Registry Check Nameserver
**Endpoint:** `POST /api/nameservers/check`

Checks if a nameserver exists at a particular registry.

**Request Body:**
```json
{
  "nameserver": "ns1.example.com",
  "tld": "com"
}
```

**Response:**
```json
{
  "success": true,
  "nameserver": "ns1.example.com",
  "tld": "com",
  "responseCode": "200",
  "responseText": "Command completed successfully"
}
```

## Authentication

The API uses OpenSRS authentication with:

- **Reseller Username**: Set via `OPENSRS_RESELLER_USERNAME` environment variable
- **API Key**: Set via `OPENSRS_API_KEY` environment variable
- **Test Mode**: Set via `OPENSRS_TEST_MODE` environment variable (true/false)

### Environment Variables

```bash
OPENSRS_RESELLER_USERNAME=your_reseller_username
OPENSRS_API_KEY=your_api_key
OPENSRS_TEST_MODE=true
OPENSRS_TEST_HOST=https://horizon.opensrs.net:55443
OPENSRS_LIVE_HOST=https://rr-n1-tor.opensrs.net:55443
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Additional error details",
  "responseCode": "400",
  "responseText": "OpenSRS error message",
  "timestamp": "2025-09-15T07:57:33.154Z"
}
```

### Common Error Codes

- **400**: Bad Request - Invalid parameters
- **500**: Internal Server Error - Server-side error
- **200**: Success - Command completed successfully

## Examples

### Complete Domain Setup Workflow

1. **Search for domains:**
```bash
curl -X POST http://localhost:3001/api/domains/search \
  -H "Content-Type: application/json" \
  -d '{"search_query": "mycompany"}'
```

2. **Check specific domain:**
```bash
curl -X POST http://localhost:3001/api/domains/lookup \
  -H "Content-Type: application/json" \
  -d '{"domain": "mycompany.com"}'
```

3. **Get pricing:**
```bash
curl http://localhost:3001/api/domains/mycompany.com/price
```

4. **Create DNS zone:**
```bash
curl -X POST http://localhost:3001/api/dns/create-zone \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mycompany.com",
    "records": [
      {
        "type": "A",
        "subdomain": "www",
        "address": "1.2.3.4",
        "ttl": 3600
      }
    ]
  }'
```

5. **Add additional DNS record:**
```bash
curl -X POST http://localhost:3001/api/dns/add-record \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mycompany.com",
    "record": {
      "type": "MX",
      "host": "",
      "value": "mail.mycompany.com",
      "priority": 10,
      "ttl": 3600
    }
  }'
```

6. **Enable auto-renew:**
```bash
curl -X PUT http://localhost:3001/api/domains/mycompany.com/autorenew \
  -H "Content-Type: application/json" \
  -d '{"autoRenew": true, "letExpire": false}'
```

7. **Enable WHOIS privacy:**
```bash
curl -X PUT http://localhost:3001/api/domains/mycompany.com/whois-privacy \
  -H "Content-Type: application/json" \
  -d '{"state": "enable"}'
```

## Troubleshooting

### Common Issues

1. **"Invalid Command" errors**: Ensure you're using the correct OpenSRS API version and action names.

2. **Authentication failures**: Verify your reseller username and API key are correct.

3. **DNS records being overwritten**: The `add-record` and `update-record` endpoints preserve existing records by retrieving them first, then adding/updating the specific record.

4. **Timeout errors**: Increase the timeout value in the OpenSRS client configuration.

### Debug Mode

Enable detailed logging by setting the environment variable:
```bash
DEBUG=opensrs:*
```

### Testing

Use the provided `test.http` file to test all endpoints with sample requests.

## Support

For OpenSRS-specific issues, refer to the [OpenSRS API Documentation](https://domains.opensrs.guide/docs/dns-zone-commands-overview).

For integration issues, check the server logs for detailed error information.
