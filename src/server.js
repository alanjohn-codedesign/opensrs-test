require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Import routes
const domainRoutes = require('./routes/domain-routes');
const dnsRoutes = require('./routes/dns-routes');
const nameserverRoutes = require('./routes/nameserver-routes');
const transferRoutes = require('./routes/transfer-routes');
const suggestionsRoutes = require('./routes/suggestions-routes');
const pricingRoutes = require('./routes/pricing-routes');
const OpenSRSClient = require('./lib/opensrs-client');

// Create Express app
const app = express();
const opensrsClient = new OpenSRSClient();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your frontend domain
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check the health status of the API server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'OpenSRS API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'OpenSRS API Backend',
    version: '1.0.0',
    description: 'Node.js backend for OpenSRS API integration',
    documentation: {
      swagger: '/api-docs',
      openapi: '/api-docs/swagger.json'
    },
    endpoints: {
      health: 'GET /health',
      domains: {
        lookup: 'POST /api/domains/lookup',
        bulkLookup: 'POST /api/domains/bulk-lookup',
        register: 'POST /api/domains/register',
        getDomain: 'GET /api/domains/:domain',
        renewDomain: 'POST /api/domains/:domain/renew',
        modifyDomain: 'PUT /api/domains/:domain',
        updateContacts: 'PUT /api/domains/:domain/contacts',
        getPrice: 'GET /api/domains/:domain/price',
        bulkPrice: 'POST /api/domains/bulk-price'
      },
      dns: {
        createZone: 'POST /api/dns/zones',
        getZone: 'GET /api/dns/zones/:domain',
        setRecords: 'PUT /api/dns/zones/:domain/records',
        deleteZone: 'DELETE /api/dns/zones/:domain',
        resetZone: 'POST /api/dns/zones/:domain/reset'
      },
      nameservers: {
        create: 'POST /api/nameservers',
        get: 'GET /api/nameservers/:nameserver',
        modify: 'PUT /api/nameservers/:nameserver',
        delete: 'DELETE /api/nameservers/:nameserver',
        updateDomain: 'PUT /api/nameservers/domains/:domain/update'
      },
      transfers: {
        check: 'POST /api/transfers/check',
        process: 'POST /api/transfers/process',
        cancel: 'POST /api/transfers/:domain/cancel',
        getIn: 'GET /api/transfers/in',
        getAway: 'GET /api/transfers/away'
      },
      suggestions: {
        get: 'POST /api/suggestions'
      },
      pricing: {
        get: 'GET /api/pricing/:domain',
        bulk: 'POST /api/pricing/bulk'
      },
      account: {
        getBalance: 'GET /api/account/balance'
      }
    },
    externalDocs: 'https://domains.opensrs.guide/docs/quickstart'
  });
});

// Serve Swagger JSON
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecs);
});

// API routes
app.use('/api/domains', domainRoutes);
app.use('/api/dns', dnsRoutes);
app.use('/api/nameservers', nameserverRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/pricing', pricingRoutes);

/**
 * @swagger
 * /api/account/balance:
 *   get:
 *     summary: Get account balance
 *     description: Retrieve the current account balance from OpenSRS
 *     tags: [Account]
 *     responses:
 *       200:
 *         description: Account balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountBalanceResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Account balance route
app.get('/api/account/balance', async (req, res) => {
  try {
    const result = await opensrsClient.getBalance();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to get account balance'
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    availableRoutes: [
      'GET /health',
      'GET /api',
      'GET /api-docs',
      'GET /api-docs/swagger.json',
      'POST /api/domains/lookup',
      'POST /api/domains/bulk-lookup',
      'POST /api/domains/register',
      'GET /api/domains/:domain',
      'POST /api/domains/:domain/renew',
      'PUT /api/domains/:domain',
      'PUT /api/domains/:domain/contacts',
      'GET /api/domains/:domain/price',
      'POST /api/domains/bulk-price',
      'POST /api/dns/zones',
      'GET /api/dns/zones/:domain',
      'PUT /api/dns/zones/:domain/records',
      'DELETE /api/dns/zones/:domain',
      'POST /api/dns/zones/:domain/reset',
      'POST /api/nameservers',
      'GET /api/nameservers/:nameserver',
      'PUT /api/nameservers/:nameserver',
      'DELETE /api/nameservers/:nameserver',
      'PUT /api/nameservers/domains/:domain/update',
      'POST /api/transfers/check',
      'POST /api/transfers/process',
      'POST /api/transfers/:domain/cancel',
      'GET /api/transfers/in',
      'GET /api/transfers/away',
      'POST /api/suggestions',
      'GET /api/pricing/:domain',
      'POST /api/pricing/bulk',
      'GET /api/account/balance'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.message,
      details: error.details
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or missing authentication'
    });
  }
  
  // Default error response
  res.status(error.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong on the server'
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 OpenSRS API Backend server running on http://${HOST}:${PORT}`);
  console.log(`📚 API Documentation: http://${HOST}:${PORT}/api`);
  console.log(`📖 Swagger UI: http://${HOST}:${PORT}/api-docs`);
  console.log(`💚 Health Check: http://${HOST}:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Test Mode: ${process.env.OPENSRS_TEST_MODE || 'false'}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

module.exports = app;
