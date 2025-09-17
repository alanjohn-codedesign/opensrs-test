const mongoose = require('mongoose');

class DatabaseManager {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        return this.connection;
      }

      const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_TEST_URI;
      console.log('🔧 Connecting to MongoDB...');
      console.log('🔧 Using URI:', mongoUri ? 'Set' : 'Not set');
      console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
      
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000, // Increased for cloud connections
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000, // Added for cloud connections
        bufferCommands: false,
        retryWrites: true, // Added for MongoDB Atlas
        useNewUrlParser: true,
        useUnifiedTopology: true
      };

      this.connection = await mongoose.connect(mongoUri, options);
      this.isConnected = true;

      mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connected successfully');
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        this.connection = null;
        this.isConnected = false;
        console.log('📴 MongoDB disconnected');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { healthy: false, message: 'Not connected to database' };
      }

      // Simple ping to check connection
      await mongoose.connection.db.admin().ping();
      
      return { 
        healthy: true, 
        message: 'Database connection is healthy',
        status: this.getStatus()
      };
    } catch (error) {
      return { 
        healthy: false, 
        message: 'Database health check failed', 
        error: error.message 
      };
    }
  }
}

module.exports = new DatabaseManager();
