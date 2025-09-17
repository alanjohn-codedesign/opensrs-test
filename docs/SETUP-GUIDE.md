# OpenSRS API Setup Guide

This guide will help you set up and configure the OpenSRS API integration.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenSRS reseller account
- OpenSRS API credentials

## Installation

1. **Clone or download the project:**
```bash
git clone <repository-url>
cd opensrs-api
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env
```

4. **Configure your .env file:**
```bash
# OpenSRS Configuration
OPENSRS_RESELLER_USERNAME=your_reseller_username
OPENSRS_API_KEY=your_api_key
OPENSRS_TEST_MODE=true

# API Hosts (optional - defaults provided)
OPENSRS_TEST_HOST=https://horizon.opensrs.net:55443
OPENSRS_LIVE_HOST=https://rr-n1-tor.opensrs.net:55443

# Server Configuration
PORT=3001
NODE_ENV=development
```

## OpenSRS Account Setup

### 1. Get Your Credentials

1. Log in to your OpenSRS Reseller Control Panel (RCP)
2. Navigate to **Account Settings** → **API Settings**
3. Note your:
   - Reseller Username
   - API Key

### 2. Configure IP Access

1. In the RCP, go to **API Settings**
2. Add your server's IP address to the **IP Access Rules**
3. Save the changes

**Note:** IP changes can take up to 15 minutes to take effect.

### 3. Test Mode vs Live Mode

- **Test Mode**: Use for development and testing
- **Live Mode**: Use for production operations

Set `OPENSRS_TEST_MODE=true` for testing, `false` for production.

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENSRS_RESELLER_USERNAME` | Your OpenSRS reseller username | Yes | - |
| `OPENSRS_API_KEY` | Your OpenSRS API key | Yes | - |
| `OPENSRS_TEST_MODE` | Enable test mode | Yes | true |
| `OPENSRS_TEST_HOST` | Test API host | No | horizon.opensrs.net:55443 |
| `OPENSRS_LIVE_HOST` | Live API host | No | rr-n1-tor.opensrs.net:55443 |
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment | No | development |

### API Hosts

**Test Environment:**
- Host: `https://horizon.opensrs.net:55443`
- Use for development and testing
- Safe to experiment with

**Live Environment:**
- Host: `https://rr-n1-tor.opensrs.net:55443`
- Use for production
- Real domain operations

## Running the Server

### Development Mode

```bash
npm start
```

The server will start on `http://localhost:3001`

### Production Mode

```bash
NODE_ENV=production npm start
```

### Using PM2 (Recommended for Production)

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start src/server.js --name "opensrs-api"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Testing the Setup

### 1. Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-09-15T07:57:33.154Z",
  "uptime": 123.456
}
```

### 2. Test Domain Lookup

```bash
curl -X POST http://localhost:3001/api/domains/lookup \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'
```

### 3. Test Domain Search

```bash
curl -X POST http://localhost:3001/api/domains/search \
  -H "Content-Type: application/json" \
  -d '{"search_query": "test"}'
```

## Using the Test File

The project includes a `test.http` file with sample requests:

1. **Install REST Client extension** (VS Code) or use any HTTP client
2. **Open `test.http`**
3. **Update domain names** in the requests to match your test domains
4. **Run the requests** to test different endpoints

## Common Setup Issues

### 1. Authentication Errors

**Error:** `Invalid credentials`
**Solution:** 
- Verify your reseller username and API key
- Check that your IP is whitelisted in OpenSRS RCP
- Wait 15 minutes after adding IP to access rules

### 2. Connection Timeouts

**Error:** `Request timeout`
**Solution:**
- Check your internet connection
- Verify the API host URLs are correct
- Check if your firewall blocks the connection

### 3. Invalid Command Errors

**Error:** `Invalid Command: command_name`
**Solution:**
- Ensure you're using the correct API version
- Check that the command is supported in your OpenSRS plan
- Verify the XML format is correct

### 4. Domain Not Found

**Error:** `Domain not found in your account`
**Solution:**
- Ensure the domain exists in your OpenSRS account
- Check the domain spelling
- Verify you have permissions for the domain

## Security Considerations

### 1. Environment Variables

- Never commit `.env` files to version control
- Use strong, unique API keys
- Rotate API keys regularly

### 2. IP Whitelisting

- Only whitelist necessary IP addresses
- Remove unused IP addresses from access rules
- Monitor access logs regularly

### 3. API Key Management

- Store API keys securely
- Use environment variables, not hardcoded values
- Implement proper access controls

## Monitoring and Logging

### 1. Enable Debug Logging

```bash
DEBUG=opensrs:* npm start
```

### 2. Monitor API Responses

The API includes detailed logging for:
- Request/response data
- Error messages
- Performance metrics
- Cache statistics

### 3. Health Monitoring

Implement health checks for:
- API connectivity
- OpenSRS service status
- Response times
- Error rates

## Production Deployment

### 1. Server Requirements

- **CPU:** 2+ cores recommended
- **RAM:** 2GB+ recommended
- **Storage:** 10GB+ for logs and cache
- **Network:** Stable internet connection

### 2. Load Balancing

For high-traffic applications:
- Use a load balancer (nginx, HAProxy)
- Deploy multiple instances
- Implement session persistence if needed

### 3. Caching

The API includes built-in caching for:
- Domain lookups
- Price queries
- DNS zone data

Configure cache TTL based on your needs.

### 4. Rate Limiting

Consider implementing rate limiting for:
- API endpoints
- Per-IP requests
- Per-user requests

## Troubleshooting

### 1. Check Logs

```bash
# View application logs
tail -f logs/app.log

# View PM2 logs
pm2 logs opensrs-api
```

### 2. Test Connectivity

```bash
# Test OpenSRS API connectivity
curl -v https://horizon.opensrs.net:55443
```

### 3. Verify Configuration

```bash
# Check environment variables
node -e "console.log(process.env.OPENSRS_RESELLER_USERNAME)"
```

### 4. API Testing

Use the provided test file or create your own tests:

```bash
# Test all endpoints
npm test
```

## Support

### OpenSRS Support

- **Documentation:** https://domains.opensrs.guide/
- **Support Portal:** https://support.opensrs.com/
- **API Reference:** https://domains.opensrs.guide/docs/dns-zone-commands-overview

### Integration Support

For issues with this integration:
1. Check the logs for error details
2. Verify your OpenSRS configuration
3. Test with the provided sample requests
4. Review the API documentation

## Next Steps

1. **Test all endpoints** using the provided test file
2. **Integrate with your application** using the API endpoints
3. **Monitor performance** and adjust caching as needed
4. **Implement error handling** in your application
5. **Set up monitoring** for production use
