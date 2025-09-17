const express = require('express');
const cors = require('cors');
require('dotenv').config();

const OpenSRSClient = require('./lib/opensrs-client');
const DatabaseManager = require('./config/database');

const app = express();

// Initialize OpenSRS client
const opensrsClient = new OpenSRSClient();

// Initialize database connection
DatabaseManager.connect()
  .then(() => {
    console.log('🗄️ Database connection initialized');
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inject OpenSRS client and database into all requests
app.use((req, res, next) => {
  req.opensrsClient = opensrsClient;
  req.database = DatabaseManager;
  next();
});

// Routes
const healthRoutes = require('./routes/health-routes');
const domainRoutes = require('./routes/domain-routes');
const registrationRoutes = require('./routes/registration-routes');
const dnsRoutes = require('./routes/dns-routes');
const nameserverRoutes = require('./routes/nameserver-routes');
const userRoutes = require('./routes/user-routes');
const userDomainRoutes = require('./routes/user-domain-routes');

app.use('/', healthRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/dns', dnsRoutes);
app.use('/api/nameservers', nameserverRoutes);
app.use('/api', userRoutes);
app.use('/api', userDomainRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 OpenSRS Domain API server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Domain search: http://localhost:${PORT}/api/domains/search`);
  console.log(`📝 Domain registration: http://localhost:${PORT}/api/registration/register`);
  console.log(`🌐 DNS management: http://localhost:${PORT}/api/dns/create-zone`);
  console.log(`🖥️ Nameserver management: http://localhost:${PORT}/api/nameservers/update`);
  console.log(`📖 Test endpoints using test.http and test-registration.http files`);
});

module.exports = app;
