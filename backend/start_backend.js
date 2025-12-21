// Simple server startup script
const app = require('./src/app');
const PORT = 5000;

console.log('🚀 Starting Creamingo Backend Server...');

const server = app.listen(PORT, () => {
  console.log(`
🚀 Creamingo Backend API Server Started!
📍 Server running on port ${PORT}
🌍 Environment: development
🔗 Health check: http://localhost:${PORT}/health
📚 API Base URL: http://localhost:${PORT}/api
🗄️ Database: SQLite (./database/creamingo.db)

✅ Server is ready to accept connections!
✅ You can now use the admin panel login.
✅ Keep this window open while using the admin panel.
  `);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please close other applications using this port.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

// Keep the process alive
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});
