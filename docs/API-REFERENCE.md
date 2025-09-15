# OpenSRS API Reference

Complete reference for all API endpoints, request/response formats, and error codes.

## Base URL

```
http://localhost:3000/api
```

## Domain Management APIs

### POST /domains/search

Searches for domain suggestions with availability and pricing.

**Request:**
```json
{
  "search_query": "string"
}
```

**Response:**
```json
{
  "search_query": "string",
  "suggestions": [
    {
      "domain": "string",
      "availability": "available|taken|unknown",
      "price": "number|null",
      "currency": "string|null"
    }
  ],
  "stats": {
    "total_checked": "number",
    "available_count": "number",
    "processing_time_ms": "number",
    "cache_stats": "object"
  }
}
```

**Error Responses:**
- `400`: Missing search_query parameter
- `500`: Search failed

---

### POST /domains/lookup

Checks availability of a single domain.

**Request:**
```json
{
  "domain": "string"
}
```

**Response:**
```json
{
  "success": "boolean",
  "domain": "string",
  "availability": "string",
  "responseCode": "string",
  "responseText": "string"
}
```

**Error Responses:**
- `400`: Missing domain parameter
- `500`: Lookup failed

---

### GET /domains/:domain/price

Gets pricing information for a domain.

**Response:**
```json
{
  "success": "boolean",
  "domain": "string",
  "price": "number|null",
  "currency": "string",
  "responseCode": "string",
  "responseText": "string"
}
```

**Error Responses:**
- `500`: Price retrieval failed

---

### POST /domains/suggestions

Gets domain name suggestions.

**Request:**
```json
{
  "search_string": "string"
}
```

**Response:**
```json
{
  "success": "boolean",
  "search_string": "string",
  "suggestions": "array",
  "responseCode": "string",
  "responseText": "string"
}
```

**Error Responses:**
- `400`: Missing search_string parameter
- `500`: Suggestions failed

---

## DNS Zone Management APIs

### POST /dns/create-zone

Creates a new DNS zone with initial records.

**Request:**
```json
{
  "domain": "string",
  "records": [
    {
      "type": "A|AAAA|CNAME|MX|TXT|SRV",
      "subdomain": "string",
      "address": "string",
      "ttl": "number",
      "priority": "number (for MX/SRV)",
      "weight": "number (for SRV)",
      "port": "number (for SRV)"
    }
  ]
}
```

**Response:**
```json
{
  "success": "boolean",
  "data": "object",
  "timestamp": "string"
}
```

**Error Responses:**
- `400`: Missing domain or invalid records
- `500`: Zone creation failed

---

### GET /dns/get-zone/:domain

Retrieves all DNS records for a domain.

**Response:**
```json
{
  "success": "boolean",
  "data": {
    "records": [
      {
        "type": "string",
        "subdomain": "string",
        "address": "string",
        "ttl": "number",
        "priority": "number (for MX/SRV)",
        "weight": "number (for SRV)",
        "port": "number (for SRV)"
      }
    ]
  },
  "timestamp": "string"
}
```

**Error Responses:**
- `400`: Missing domain parameter
- `500`: Zone retrieval failed

---

### POST /dns/set-zone

Replaces all DNS records for a domain.

**Request:**
```json
{
  "domain": "string",
  "records": [
    {
      "type": "A|AAAA|CNAME|MX|TXT|SRV",
      "subdomain": "string",
      "address": "string",
      "ttl": "number",
      "priority": "number (for MX/SRV)",
      "weight": "number (for SRV)",
      "port": "number (for SRV)"
    }
  ]
}
```

**Response:**
```json
{
  "success": "boolean",
  "data": "object",
  "timestamp": "string"
}
```

**Error Responses:**
- `400`: Missing domain or records
- `500`: Zone update failed

---

### POST /dns/add-record

Adds a single DNS record to existing zone (preserves existing records).

**Request:**
```json
{
  "domain": "string",
  "record": {
    "type": "A|AAAA|CNAME|MX|TXT|SRV",
    "host": "string",
    "value": "string",
    "ttl": "number",
    "priority": "number (for MX/SRV)",
    "weight": "number (for SRV)",
    "port": "number (for SRV)"
  }
}
```

**Response:**
```json
{
  "success": "boolean",
  "data": "object",
  "message": "string",
  "responseCode": "string",
  "responseText": "string",
  "timestamp": "string"
}
```

**Error Responses:**
- `400`: Missing required fields
- `500`: Record addition failed

---

### POST /dns/update-record

Updates an existing DNS record (preserves other records).

**Request:**
```json
{
  "domain": "string",
  "record": {
    "type": "A|AAAA|CNAME|MX|TXT|SRV",
    "host": "string",
    "value": "string",
    "ttl": "number",
    "priority": "number (for MX/SRV)",
    "weight": "number (for SRV)",
    "port": "number (for SRV)"
  }
}
```

**Response:**
```json
{
  "success": "boolean",
  "data": "object",
  "message": "string",
  "responseCode": "string",
  "responseText": "string",
  "timestamp": "string"
}
```

**Error Responses:**
- `400`: Missing required fields or no existing zone
- `500`: Record update failed

---

### DELETE /dns/delete-zone/:domain

Deletes entire DNS zone for a domain.

**Response:**
```json
{
  "success": "boolean",
  "data": "object",
  "timestamp": "string"
}
```

**Error Responses:**
- `400`: Missing domain parameter
- `500`: Zone deletion failed

---

## Domain Modification APIs

### PUT /domains/:domain/autorenew

Modifies domain auto-renew and expiration settings.

**Request:**
```json
{
  "autoRenew": "boolean|number",
  "letExpire": "boolean|number"
}
```

**Response:**
```json
{
  "success": "boolean",
  "domain": "string",
  "autoRenew": "boolean",
  "letExpire": "boolean",
  "responseCode": "string",
  "responseText": "string",
  "data": "object"
}
```

**Error Responses:**
- `400`: Invalid parameters
- `500`: Modification failed

---

### GET /domains/:domain/whois-privacy

Gets the current WHOIS privacy state for a domain.

**Response:**
```json
{
  "success": "boolean",
  "domain": "string",
  "whoisPrivacyState": "enabled|disabled|unknown",
  "responseCode": "string",
  "responseText": "string",
  "data": "object"
}
```

**Error Responses:**
- `500`: Retrieval failed

---

### PUT /domains/:domain/whois-privacy

Enables or disables WHOIS privacy for a domain.

**Request:**
```json
{
  "state": "enable|disable"
}
```

**Response:**
```json
{
  "success": "boolean",
  "domain": "string",
  "whoisPrivacyState": "string",
  "responseCode": "string",
  "responseText": "string",
  "data": "object"
}
```

**Error Responses:**
- `400`: Invalid state parameter
- `500`: Modification failed

---

## Nameserver Management APIs

### POST /nameservers/update

Advanced update nameservers for domain (assign or remove).

**Request:**
```json
{
  "domain": "string",
  "op_type": "assign|remove",
  "nameservers": ["string"]
}
```

**Response:**
```json
{
  "success": "boolean",
  "domain": "string",
  "operation": "string",
  "nameservers": "array",
  "responseCode": "string",
  "responseText": "string",
  "data": "object"
}
```

**Error Responses:**
- `400`: Missing required fields or invalid op_type
- `500`: Update failed

---

### GET /nameservers/:nameserver

Get nameserver information.

**Response:**
```json
{
  "success": "boolean",
  "nameserver": "string",
  "responseCode": "string",
  "responseText": "string",
  "data": "object"
}
```

**Error Responses:**
- `400`: Missing nameserver parameter
- `500`: Retrieval failed

---

### POST /nameservers/create

Create a new nameserver.

**Request:**
```json
{
  "nameserver": "string",
  "ip_addresses": ["string"]
}
```

**Response:**
```json
{
  "success": "boolean",
  "nameserver": "string",
  "ip_addresses": "array",
  "responseCode": "string",
  "responseText": "string",
  "data": "object"
}
```

**Error Responses:**
- `400`: Missing nameserver parameter
- `500`: Creation failed

---

### DELETE /nameservers/:nameserver

Delete a nameserver.

**Response:**
```json
{
  "success": "boolean",
  "nameserver": "string",
  "responseCode": "string",
  "responseText": "string",
  "data": "object"
}
```

**Error Responses:**
- `400`: Missing nameserver parameter
- `500`: Deletion failed

---

### PUT /nameservers/:nameserver

Modify a nameserver.

**Request:**
```json
{
  "ip_addresses": ["string"]
}
```

**Response:**
```json
{
  "success": "boolean",
  "nameserver": "string",
  "ip_addresses": "array",
  "responseCode": "string",
  "responseText": "string",
  "data": "object"
}
```

**Error Responses:**
- `400`: Missing nameserver parameter
- `500`: Modification failed

---

### POST /nameservers/check

Registry check nameserver.

**Request:**
```json
{
  "nameserver": "string",
  "tld": "string (optional)"
}
```

**Response:**
```json
{
  "success": "boolean",
  "nameserver": "string",
  "tld": "string",
  "responseCode": "string",
  "responseText": "string",
  "data": "object"
}
```

**Error Responses:**
- `400`: Missing nameserver parameter
- `500`: Check failed

---

## Cache Management APIs

### GET /domains/cache/stats

Gets cache statistics.

**Response:**
```json
{
  "success": "boolean",
  "cache_stats": "object",
  "timestamp": "string"
}
```

---

### POST /domains/cache/clear

Clears expired cache entries.

**Response:**
```json
{
  "success": "boolean",
  "message": "string",
  "cache_stats": "object",
  "timestamp": "string"
}
```

---

## Health Check

### GET /health

Server health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "string",
  "uptime": "number"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": "false",
  "error": "string",
  "message": "string",
  "responseCode": "string",
  "responseText": "string",
  "timestamp": "string"
}
```

## HTTP Status Codes

- `200`: Success
- `400`: Bad Request - Invalid parameters
- `500`: Internal Server Error - Server-side error

## Rate Limiting

No rate limiting is currently implemented. Consider implementing rate limiting for production use.

## Authentication

All requests require valid OpenSRS credentials configured via environment variables:

- `OPENSRS_RESELLER_USERNAME`
- `OPENSRS_API_KEY`
- `OPENSRS_TEST_MODE`
