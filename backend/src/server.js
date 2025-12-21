// Set JWT_SECRET if not already set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'creamingo_super_secret_jwt_key_2024_secure';
  process.env.JWT_EXPIRES_IN = '7d';
}

const app = require('./app');
const { close } = require('./config/db');
const { initDatabase, needsInitialization } = require('./utils/initDatabase');

const PORT = process.env.PORT || 5000;

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Shutting down gracefully...');
  
  // Close database connection
  await close();
  process.exit(0);
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  gracefulShutdown();
});

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Initialize database and start server
const startServer = async () => {
  try {
    // Check if database needs initialization
    if (await needsInitialization()) {
      await initDatabase();
    }
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`
🚀 Creamingo Backend API Server Started!
📍 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Health check: http://localhost:${PORT}/health
📚 API Base URL: http://localhost:${PORT}/api
🗄️ Database: SQLite (./database/creamingo.db)
      `);
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
const serverPromise = startServer();

// Handle server errors
serverPromise.then(server => {
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    gracefulShutdown();
  });
}).catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

module.exports = serverPromise;
