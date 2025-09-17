# DNS Record Types Reference

This document provides detailed information about supported DNS record types and their usage in the OpenSRS API integration.

## Supported Record Types

### A Record (IPv4 Address)

Maps a domain name to an IPv4 address.

**Usage:**
```json
{
  "type": "A",
  "host": "www",
  "value": "192.168.1.1",
  "ttl": 3600
}
```

**Fields:**
- `type`: "A"
- `host`: Subdomain (e.g., "www", "mail", "sub")
- `value`: IPv4 address (e.g., "192.168.1.1")
- `ttl`: Time to live in seconds (default: 3600)

**Example:**
```bash
curl -X POST http://localhost:3001/api/dns/add-record \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "record": {
      "type": "A",
      "host": "www",
      "value": "192.168.1.1",
      "ttl": 3600
    }
  }'
```

---

### AAAA Record (IPv6 Address)

Maps a domain name to an IPv6 address.

**Usage:**
```json
{
  "type": "AAAA",
  "host": "ipv6",
  "value": "2001:db8::1",
  "ttl": 3600
}
```

**Fields:**
- `type`: "AAAA"
- `host`: Subdomain
- `value`: IPv6 address (e.g., "2001:db8::1")
- `ttl`: Time to live in seconds

**Example:**
```bash
curl -X POST http://localhost:3001/api/dns/add-record \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "record": {
      "type": "AAAA",
      "host": "ipv6",
      "value": "2001:db8::1",
      "ttl": 3600
    }
  }'
```

---

### CNAME Record (Canonical Name)

Creates an alias from one domain name to another.

**Usage:**
```json
{
  "type": "CNAME",
  "host": "www",
  "value": "example.com",
  "ttl": 3600
}
```

**Fields:**
- `type`: "CNAME"
- `host`: Subdomain to alias
- `value`: Target domain name
- `ttl`: Time to live in seconds

**Example:**
```bash
curl -X POST http://localhost:3001/api/dns/add-record \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "record": {
      "type": "CNAME",
      "host": "www",
      "value": "example.com",
      "ttl": 3600
    }
  }'
```

---

### MX Record (Mail Exchange)

Specifies mail servers for the domain.

**Usage:**
```json
{
  "type": "MX",
  "host": "",
  "value": "mail.example.com",
  "priority": 10,
  "ttl": 3600
}
```

**Fields:**
- `type`: "MX"
- `host`: Usually empty string for root domain
- `value`: Mail server hostname
- `priority`: Priority number (lower = higher priority)
- `ttl`: Time to live in seconds

**Example:**
```bash
curl -X POST http://localhost:3001/api/dns/add-record \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "record": {
      "type": "MX",
      "host": "",
      "value": "mail.example.com",
      "priority": 10,
      "ttl": 3600
    }
  }'
```

---

### TXT Record (Text)

Stores text information for various purposes (SPF, DKIM, verification, etc.).

**Usage:**
```json
{
  "type": "TXT",
  "host": "",
  "value": "v=spf1 include:_spf.google.com ~all",
  "ttl": 3600
}
```

**Fields:**
- `type`: "TXT"
- `host`: Subdomain (often empty for root)
- `value`: Text content
- `ttl`: Time to live in seconds

**Common TXT Record Examples:**

**SPF Record:**
```json
{
  "type": "TXT",
  "host": "",
  "value": "v=spf1 include:_spf.google.com ~all",
  "ttl": 3600
}
```

**DKIM Record:**
```json
{
  "type": "TXT",
  "host": "default._domainkey",
  "value": "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...",
  "ttl": 3600
}
```

**Domain Verification:**
```json
{
  "type": "TXT",
  "host": "",
  "value": "google-site-verification=abc123def456",
  "ttl": 3600
}
```

---

### SRV Record (Service)

Specifies location of services.

**Usage:**
```json
{
  "type": "SRV",
  "host": "_sip._tcp",
  "value": "sipserver.example.com",
  "priority": 10,
  "weight": 5,
  "port": 5060,
  "ttl": 3600
}
```

**Fields:**
- `type`: "SRV"
- `host`: Service name (e.g., "_sip._tcp", "_http._tcp")
- `value`: Target hostname
- `priority`: Priority number
- `weight`: Weight for load balancing
- `port`: Port number
- `ttl`: Time to live in seconds

**Example:**
```bash
curl -X POST http://localhost:3001/api/dns/add-record \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "record": {
      "type": "SRV",
      "host": "_sip._tcp",
      "value": "sipserver.example.com",
      "priority": 10,
      "weight": 5,
      "port": 5060,
      "ttl": 3600
    }
  }'
```

---

## Common DNS Configurations

### Basic Website Setup

```json
{
  "domain": "example.com",
  "records": [
    {
      "type": "A",
      "host": "",
      "value": "192.168.1.1",
      "ttl": 3600
    },
    {
      "type": "A",
      "host": "www",
      "value": "192.168.1.1",
      "ttl": 3600
    },
    {
      "type": "MX",
      "host": "",
      "value": "mail.example.com",
      "priority": 10,
      "ttl": 3600
    }
  ]
}
```

### Email Setup with SPF

```json
{
  "domain": "example.com",
  "records": [
    {
      "type": "MX",
      "host": "",
      "value": "mail.example.com",
      "priority": 10,
      "ttl": 3600
    },
    {
      "type": "TXT",
      "host": "",
      "value": "v=spf1 include:_spf.google.com ~all",
      "ttl": 3600
    }
  ]
}
```

### Load Balanced Setup

```json
{
  "domain": "example.com",
  "records": [
    {
      "type": "A",
      "host": "www",
      "value": "192.168.1.1",
      "ttl": 300
    },
    {
      "type": "A",
      "host": "www",
      "value": "192.168.1.2",
      "ttl": 300
    },
    {
      "type": "A",
      "host": "www",
      "value": "192.168.1.3",
      "ttl": 300
    }
  ]
}
```

---

## Field Mapping

### Input Fields (API Request)

| Field | Description | Required | Default |
|-------|-------------|----------|---------|
| `type` | Record type (A, AAAA, CNAME, MX, TXT, SRV) | Yes | - |
| `host` | Subdomain name | No | "" |
| `value` | Record value (IP, hostname, text) | Yes | - |
| `ttl` | Time to live in seconds | No | 3600 |
| `priority` | Priority (MX, SRV only) | No | 10 |
| `weight` | Weight (SRV only) | No | 1 |
| `port` | Port (SRV only) | No | 80 |

### Internal Fields (OpenSRS Format)

| Field | Description | Used For |
|-------|-------------|----------|
| `subdomain` | Subdomain name | All types |
| `address` | Record value | All types |
| `ip_address` | IPv4 address | A records |
| `ipv6_address` | IPv6 address | AAAA records |
| `hostname` | Hostname | CNAME, MX, SRV |
| `text` | Text content | TXT records |

---

## Best Practices

### TTL Values

- **Short TTL (300-600s)**: For frequently changing records
- **Medium TTL (3600s)**: For stable records
- **Long TTL (86400s)**: For rarely changing records

### Record Naming

- Use descriptive subdomain names
- Follow DNS naming conventions
- Avoid special characters

### Priority Values

- **MX Records**: Lower numbers = higher priority
- **SRV Records**: Lower numbers = higher priority
- Common MX priorities: 10, 20, 30

### Error Handling

Always check the response for success status:

```json
{
  "success": true,
  "message": "DNS record added successfully",
  "responseCode": "200",
  "responseText": "Command completed successfully"
}
```

---

## Troubleshooting

### Common Issues

1. **Invalid record type**: Ensure type is one of: A, AAAA, CNAME, MX, TXT, SRV
2. **Missing required fields**: Check that all required fields are provided
3. **Invalid IP format**: Ensure IPv4/IPv6 addresses are properly formatted
4. **TTL too low**: Very low TTL values may cause issues

### Validation

The API validates:
- Record type is supported
- Required fields are present
- IP addresses are properly formatted
- Priority values are numeric
- TTL values are reasonable (1-86400 seconds)
