# OpenSRS API Backend

A comprehensive Node.js backend API for OpenSRS domain management services. This project provides a RESTful interface to interact with OpenSRS APIs for domain registration, lookup, pricing, and management.

## 🚀 Features

- **Domain Lookup** - Check domain availability
- **Domain Pricing** - Get pricing information for domains
- **Domain Suggestions** - Get alternative domain suggestions
- **Domain Registration** - Register new domains
- **DNS Management** - Manage DNS zones and records
- **Nameserver Management** - Configure custom nameservers
- **Domain Transfers** - Handle domain transfers
- **Account Management** - Check account balance and status

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenSRS API credentials
- Valid OpenSRS account with API access

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd opensrs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your OpenSRS credentials:
   ```env
   OPENSRS_USERNAME=your_username
   OPENSRS_API_KEY=your_api_key
   OPENSRS_TEST_MODE=true
   OPENSRS_TEST_USERNAME=your_test_username
   OPENSRS_TEST_API_KEY=your_test_api_key
   PORT=3000
   HOST=localhost
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   npm start
   ```

   The server will start on `http://localhost:3000`

## 📚 API Documentation

### Swagger UI
Access the interactive API documentation at:
- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs/swagger.json

### API Information
Get general API information at:
- **API Info**: http://localhost:3000/api

## 🔧 Essential APIs

### 1. Domain Lookup
Check if a domain is available for registration.

```http
POST /api/domains/lookup
Content-Type: application/json

{
  "domain": "example.com"
}
```

**Response:**
```json
{
  "success": true,
  "domain": "example.com",
  "available": true,
  "responseCode": "210",
  "responseText": "Domain is available",
  "message": "Domain is available",
  "data": { ... },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Domain Pricing
Get pricing information for a domain.

```http
GET /api/domains/example.com/price
```

**Response:**
```json
{
  "success": true,
  "domain": "example.com",
  "data": {
    "price": "12.99",
    "currency": "USD",
    "registration_price": "12.99",
    "renewal_price": "12.99",
    "transfer_price": "12.99",
    "tld": "com",
    "period": 1
  }
}
```

### 3. Domain Suggestions
Get alternative domain suggestions.

```http
POST /api/suggestions
Content-Type: application/json

{
  "searchString": "example",
  "services": ["lookup", "suggestion"],
  "tlds": [".com", ".net", ".org"],
  "languages": ["en"],
  "maxWaitTime": 30
}
```

**Response:**
```json
{
  "success": true,
  "responseCode": "200",
  "responseText": "Command completed successfully",
  "suggestions": {
    "count": 10,
    "items": [
      {
        "domain": "example.com",
        "status": "available",
        "available": true
      }
    ]
  },
  "lookups": { ... },
  "isSearchCompleted": true,
  "responseTime": 0.367
}
```

### 4. Domain Registration
Register a new domain.

```http
POST /api/domains/register
Content-Type: application/json

{
  "domain": "example.com",
  "period": 1,
  "auto_renew": false,
  "whois_privacy": true,
  "registrant_contact": {
    "first_name": "John",
    "last_name": "Doe",
    "org_name": "Example Corp",
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "US",
    "postal_code": "10001",
    "phone": "+1.5551234567",
    "email": "john@example.com"
  },
  "nameservers": ["ns1.systemdns.com", "ns2.systemdns.com"]
}
```

**Response:**
```json
{
  "success": true,
  "domain": "example.com",
  "period": 1,
  "responseCode": "200",
  "responseText": "Command completed successfully",
  "orderId": "12345678",
  "data": {
    "order_id": "12345678",
    "status": "success",
    "expiry_date": "2025-01-01T00:00:00.000Z"
  }
}
```

## 🧪 Testing

### Using test.http
The project includes a comprehensive `test.http` file with all API examples:

1. Open the project in VS Code
2. Install the "REST Client" extension
3. Open `test.http`
4. Click "Send Request" above any HTTP request

### Test Examples
- **Health Check**: Verify server status
- **Domain Lookup**: Check domain availability
- **Domain Pricing**: Get pricing information
- **Domain Suggestions**: Get alternative suggestions
- **Domain Registration**: Register a new domain
- **Complete Workflow**: Step-by-step registration process

## 📁 Project Structure

```
opensrs/
├── src/
│   ├── config/
│   │   └── swagger.js          # Swagger/OpenAPI configuration
│   ├── lib/
│   │   └── opensrs-client.js   # OpenSRS API client
│   ├── routes/
│   │   ├── domain-routes.js    # Domain management routes
│   │   ├── dns-routes.js       # DNS management routes
│   │   ├── nameserver-routes.js # Nameserver management routes
│   │   ├── pricing-routes.js   # Pricing routes
│   │   ├── suggestions-routes.js # Domain suggestions routes
│   │   └── transfer-routes.js  # Domain transfer routes
│   ├── validations/
│   │   └── domain-validations.js # Input validation middleware
│   └── server.js               # Main server file
├── test.http                   # API testing file
├── package.json               # Dependencies and scripts
├── env.example               # Environment variables template
└── README.md                 # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENSRS_USERNAME` | OpenSRS username | Yes | - |
| `OPENSRS_API_KEY` | OpenSRS API key | Yes | - |
| `OPENSRS_TEST_MODE` | Enable test mode | No | `false` |
| `OPENSRS_TEST_USERNAME` | Test username | No | - |
| `OPENSRS_TEST_API_KEY` | Test API key | No | - |
| `PORT` | Server port | No | `3000` |
| `HOST` | Server host | No | `localhost` |
| `NODE_ENV` | Environment | No | `development` |

### OpenSRS Configuration

The API client automatically switches between production and test environments based on the `OPENSRS_TEST_MODE` setting:

- **Production**: `https://rr-n1-tor.opensrs.net:55443`
- **Test**: `https://horizon.opensrs.net:55443`

## 🚨 Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human-readable error description",
  "responseCode": "Error Code",
  "responseText": "OpenSRS error message"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `210` | Domain available |
| `211` | Domain taken |
| `400` | Bad request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not found |
| `500` | Internal server error |

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling
- **Input Validation** - Request validation
- **Error Handling** - Secure error responses

## 📊 Rate Limiting

The API includes built-in rate limiting:
- **Window**: 15 minutes
- **Max Requests**: 100 per window per IP
- **Headers**: Rate limit information included in responses

## 🐛 Troubleshooting

### Common Issues

1. **"Authentication failed" Error**
   - Verify OpenSRS credentials in `.env`
   - Check API key permissions
   - Ensure test mode is correctly configured

2. **"Domain is taken" Error**
   - This is normal - try alternative domains
   - Use domain suggestions API
   - Check for typos

3. **"Server not responding" Error**
   - Check if server is running on correct port
   - Verify network connectivity
   - Check server logs

4. **"Rate limit exceeded" Error**
   - Wait before making additional requests
   - Implement request throttling
   - Check OpenSRS account limits

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📝 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/api` | API information |
| GET | `/api-docs` | Swagger documentation |
| POST | `/api/domains/lookup` | Check domain availability |
| GET | `/api/domains/:domain/price` | Get domain pricing |
| POST | `/api/suggestions` | Get domain suggestions |
| POST | `/api/domains/register` | Register domain |
| GET | `/api/domains` | List all domains |
| GET | `/api/domains/:domain` | Get domain details |
| POST | `/api/domains/:domain/renew` | Renew domain |
| PUT | `/api/domains/:domain` | Modify domain |
| PUT | `/api/domains/:domain/contacts` | Update contacts |
| POST | `/api/dns/zones` | Create DNS zone |
| GET | `/api/dns/zones/:domain` | Get DNS zone |
| PUT | `/api/dns/zones/:domain/records` | Update DNS records |
| DELETE | `/api/dns/zones/:domain` | Delete DNS zone |
| POST | `/api/nameservers` | Create nameserver |
| GET | `/api/nameservers/:nameserver` | Get nameserver |
| PUT | `/api/nameservers/:nameserver` | Modify nameserver |
| DELETE | `/api/nameservers/:nameserver` | Delete nameserver |
| POST | `/api/transfers/check` | Check transfer |
| POST | `/api/transfers/process` | Process transfer |
| GET | `/api/account/balance` | Get account balance |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review OpenSRS API documentation
3. Check server logs for detailed error messages
4. Contact OpenSRS support for API-specific issues

## 🔗 Useful Links

- [OpenSRS API Documentation](https://domains.opensrs.guide/docs/quickstart)
- [OpenSRS Developer Portal](https://opensrs.com/developers/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Documentation](https://expressjs.com/)

---

**Note**: This is a backend API service. Make sure to implement proper frontend validation and error handling in your client applications.
