# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the OpenSRS API integration.

## Table of Contents

- [Common Issues](#common-issues)
- [Error Messages](#error-messages)
- [Debugging Steps](#debugging-steps)
- [Performance Issues](#performance-issues)
- [Configuration Issues](#configuration-issues)
- [OpenSRS-Specific Issues](#opensrs-specific-issues)

## Common Issues

### 1. Authentication Errors

#### Error: "Invalid credentials"
```
{
  "success": false,
  "error": "OpenSRS reseller username and API key are required"
}
```

**Causes:**
- Missing environment variables
- Incorrect credentials
- IP not whitelisted

**Solutions:**
1. Check environment variables:
   ```bash
   echo $OPENSRS_RESELLER_USERNAME
   echo $OPENSRS_API_KEY
   ```

2. Verify credentials in OpenSRS RCP:
   - Log in to Reseller Control Panel
   - Go to Account Settings → API Settings
   - Verify username and API key

3. Check IP whitelist:
   - Add your server IP to access rules
   - Wait 15 minutes for changes to take effect

#### Error: "Authentication failed"
```
{
  "success": false,
  "error": "Authentication failed",
  "responseCode": "401"
}
```

**Solutions:**
1. Verify API key is correct
2. Check if IP is whitelisted
3. Ensure you're using the correct API host for test/live mode

### 2. Connection Issues

#### Error: "Request timeout"
```
{
  "success": false,
  "error": "Request timeout"
}
```

**Causes:**
- Network connectivity issues
- OpenSRS API is down
- Firewall blocking connection

**Solutions:**
1. Test connectivity:
   ```bash
   curl -v https://horizon.opensrs.net:55443
   ```

2. Check firewall settings
3. Verify network connectivity
4. Try different API host

#### Error: "ECONNREFUSED"
```
{
  "success": false,
  "error": "connect ECONNREFUSED"
}
```

**Solutions:**
1. Check if OpenSRS API is accessible
2. Verify API host URLs
3. Check DNS resolution

### 3. DNS Record Issues

#### Error: "DNS records being overwritten"

**Cause:** OpenSRS `set_dns_zone` API **REPLACES ALL EXISTING RECORDS** with the new set provided. This is a fundamental behavior of the OpenSRS API.

**Why this happens:**
- OpenSRS `set_dns_zone` is designed to replace the entire DNS zone
- There is no "append" or "merge" operation in OpenSRS
- Every call to `set_dns_zone` overwrites all existing records

**Solution:** Our API endpoints handle this safely:
- `POST /api/dns/add-record` - Safely adds single record (preserves existing)
- `POST /api/dns/update-record` - Safely updates single record (preserves others)
- `POST /api/dns/set-zone` - Replaces ALL records (use with caution)

**How our safe endpoints work:**
1. First retrieve all existing DNS records using `get_dns_zone`
2. Add/update the specific record in the existing set
3. Send the complete record set to `set_dns_zone`

This prevents accidental data loss when managing individual DNS records.

#### Error: "Invalid record type"
```
{
  "success": false,
  "error": "Record must have either value or address field"
}
```

**Solutions:**
1. Check record format:
   ```json
   {
     "type": "A",
     "host": "www",
     "value": "192.168.1.1",
     "ttl": 3600
   }
   ```

2. Ensure required fields are present
3. Use correct field names (`host` not `subdomain` for API)

### 4. Domain Modification Issues

#### Error: "Invalid Command: add_dns_record"
```
{
  "success": false,
  "responseCode": "400",
  "responseText": "Invalid Command: add_dns_record"
}
```

**Cause:** OpenSRS doesn't support individual record commands

**Solution:** The API automatically uses `set_dns_zone` internally to preserve existing records.

#### Error: "state is required and must be 'enable' or 'disable'"
```
{
  "success": false,
  "error": "state is required and must be 'enable' or 'disable'"
}
```

**Solution:** Use correct state values:
```json
{
  "state": "enable"  // or "disable"
}
```

## Error Messages

### HTTP Status Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | - |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Check credentials and IP whitelist |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check endpoint URL |
| 500 | Internal Server Error | Check server logs |

### OpenSRS Response Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Command completed successfully | - |
| 400 | Invalid command or parameters | Check command syntax |
| 401 | Authentication failed | Check credentials |
| 403 | Access denied | Check permissions |
| 500 | Internal server error | Contact OpenSRS support |

### Common Error Patterns

#### JSON Parsing Errors
```
{
  "success": false,
  "error": "Internal server error",
  "message": "Bad control character in string literal in JSON at position 44"
}
```

**Solutions:**
1. Check for unescaped quotes in JSON
2. Remove special characters from strings
3. Validate JSON format before sending

#### XML Parsing Errors
```
{
  "success": false,
  "error": "Failed to parse XML response"
}
```

**Solutions:**
1. Check OpenSRS API response format
2. Verify XML structure
3. Check for encoding issues

## Debugging Steps

### 1. Enable Debug Logging

```bash
# Enable detailed logging
DEBUG=opensrs:* npm start

# Or set environment variable
export DEBUG=opensrs:*
npm start
```

### 2. Check Server Logs

```bash
# View application logs
tail -f logs/app.log

# View PM2 logs
pm2 logs opensrs-api

# View system logs
journalctl -u your-service-name -f
```

### 3. Test API Connectivity

```bash
# Test basic connectivity
curl -v https://horizon.opensrs.net:55443

# Test with authentication
curl -X POST https://horizon.opensrs.net:55443 \
  -H "Content-Type: text/xml" \
  -H "X-Username: your_username" \
  -H "X-Signature: your_signature" \
  -d '<?xml version="1.0"?><OPS_envelope>...</OPS_envelope>'
```

### 4. Verify Configuration

```bash
# Check environment variables
node -e "console.log(process.env.OPENSRS_RESELLER_USERNAME)"
node -e "console.log(process.env.OPENSRS_API_KEY)"
node -e "console.log(process.env.OPENSRS_TEST_MODE)"

# Test configuration loading
node -e "const client = require('./src/lib/opensrs-client'); console.log('Config loaded successfully');"
```

### 5. Test Individual Components

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test domain lookup
curl -X POST http://localhost:3000/api/domains/lookup \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'

# Test DNS zone retrieval
curl http://localhost:3000/api/dns/get-zone/example.com
```

## Performance Issues

### 1. Slow Response Times

**Symptoms:**
- API responses take > 10 seconds
- Timeout errors
- High server load

**Solutions:**
1. Check network latency:
   ```bash
   ping horizon.opensrs.net
   ```

2. Enable caching:
   ```javascript
   // Cache is enabled by default
   // Check cache stats
   curl http://localhost:3000/api/domains/cache/stats
   ```

3. Optimize DNS queries:
   - Use batch operations when possible
   - Cache frequently accessed data
   - Implement connection pooling

### 2. Memory Issues

**Symptoms:**
- High memory usage
- Out of memory errors
- Slow garbage collection

**Solutions:**
1. Monitor memory usage:
   ```bash
   # Check Node.js memory usage
   node --inspect src/server.js
   ```

2. Optimize cache settings:
   ```javascript
   // Adjust cache TTL
   const cache = new CacheManager({
     defaultTTL: 300000, // 5 minutes
     maxSize: 1000
   });
   ```

3. Implement memory monitoring:
   ```javascript
   setInterval(() => {
     const used = process.memoryUsage();
     console.log('Memory usage:', used);
   }, 30000);
   ```

### 3. High CPU Usage

**Symptoms:**
- High CPU utilization
- Slow response times
- Server unresponsive

**Solutions:**
1. Profile the application:
   ```bash
   # Use Node.js profiler
   node --prof src/server.js
   ```

2. Optimize XML parsing:
   - Cache parsed responses
   - Use streaming parsers for large responses
   - Implement request queuing

3. Scale horizontally:
   - Deploy multiple instances
   - Use load balancer
   - Implement clustering

## Configuration Issues

### 1. Environment Variables Not Loading

**Symptoms:**
- "Missing required field" errors
- Undefined environment variables
- Configuration not applied

**Solutions:**
1. Check .env file:
   ```bash
   # Verify .env file exists and has correct format
   cat .env
   ```

2. Load environment variables:
   ```bash
   # Install dotenv if not already installed
   npm install dotenv
   
   # Load in your application
   require('dotenv').config();
   ```

3. Verify variable names:
   ```bash
   # Check exact variable names
   grep -r "OPENSRS_" .env
   ```

### 2. API Host Configuration

**Symptoms:**
- Connection refused errors
- Wrong API responses
- Authentication failures

**Solutions:**
1. Check API host URLs:
   ```javascript
   const testHost = 'https://horizon.opensrs.net:55443';
   const liveHost = 'https://rr-n1-tor.opensrs.net:55443';
   ```

2. Verify test vs live mode:
   ```bash
   echo $OPENSRS_TEST_MODE
   ```

3. Test both environments:
   ```bash
   # Test environment
   OPENSRS_TEST_MODE=true npm start
   
   # Live environment
   OPENSRS_TEST_MODE=false npm start
   ```

### 3. Port Configuration

**Symptoms:**
- "Port already in use" errors
- Cannot connect to API
- Service not starting

**Solutions:**
1. Check port availability:
   ```bash
   # Check if port is in use
   lsof -i :3000
   
   # Find available port
   netstat -tulpn | grep :3000
   ```

2. Change port:
   ```bash
   # Set different port
   PORT=3001 npm start
   
   # Or in .env file
   echo "PORT=3001" >> .env
   ```

3. Kill existing processes:
   ```bash
   # Kill process using port
   kill -9 $(lsof -t -i:3000)
   ```

## OpenSRS-Specific Issues

### 1. Domain Not Found

**Error:**
```
{
  "success": false,
  "error": "Domain not found in your account"
}
```

**Solutions:**
1. Verify domain exists in your OpenSRS account
2. Check domain spelling
3. Ensure you have permissions for the domain
4. Check if domain is in correct reseller account

### 2. Invalid Command Errors

**Error:**
```
{
  "success": false,
  "responseCode": "400",
  "responseText": "Invalid Command: command_name"
}
```

**Solutions:**
1. Check OpenSRS API documentation
2. Verify command is supported in your plan
3. Check XML format and structure
4. Ensure you're using correct API version

### 3. Rate Limiting

**Error:**
```
{
  "success": false,
  "responseCode": "429",
  "responseText": "Too many requests"
}
```

**Solutions:**
1. Implement request throttling
2. Add delays between requests
3. Use batch operations when possible
4. Implement exponential backoff

### 4. DNS Zone Issues

**Error:**
```
{
  "success": false,
  "error": "DNS zone not found"
}
```

**Solutions:**
1. Create DNS zone first:
   ```bash
   curl -X POST http://localhost:3000/api/dns/create-zone \
     -H "Content-Type: application/json" \
     -d '{"domain": "example.com", "records": []}'
   ```

2. Check domain status
3. Verify domain is active
4. Check OpenSRS account permissions

## Getting Help

### 1. Check Logs

Always check the server logs first:
```bash
# Application logs
tail -f logs/app.log

# System logs
journalctl -u your-service-name -f

# PM2 logs
pm2 logs opensrs-api
```

### 2. Enable Debug Mode

```bash
# Enable detailed logging
DEBUG=opensrs:* npm start

# Or set in environment
export DEBUG=opensrs:*
```

### 3. Test with Sample Data

Use the provided test file:
```bash
# Run test requests
# Open test.http in VS Code with REST Client extension
# Or use curl with the examples
```

### 4. Contact Support

**OpenSRS Support:**
- Documentation: https://domains.opensrs.guide/
- Support Portal: https://support.opensrs.com/

**Integration Issues:**
1. Check this troubleshooting guide
2. Review server logs
3. Test with sample requests
4. Verify configuration

### 5. Common Solutions Checklist

- [ ] Environment variables are set correctly
- [ ] IP address is whitelisted in OpenSRS RCP
- [ ] API credentials are correct
- [ ] Network connectivity is working
- [ ] OpenSRS API is accessible
- [ ] Request format is correct
- [ ] Domain exists in your account
- [ ] You have permissions for the domain
- [ ] Server logs show detailed error information
- [ ] Test with sample requests works

If you've checked all these items and still have issues, please provide:
1. Error message and response code
2. Server logs
3. Request being made
4. Configuration details (without sensitive information)
5. Steps to reproduce the issue
