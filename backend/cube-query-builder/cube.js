// Cube configuration options: https://cube.dev/docs/config
/** @type{ import('@cubejs-backend/server-core').CreateOptions } */
module.exports = {
  // Enable CORS for frontend connection
  http: {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'], // Updated ports
      credentials: true,
    },
  },
  
  // API configuration
  apiSecret: process.env.CUBEJS_API_SECRET || 'secret',
  
  // Use SQLite driver factory to avoid PostgreSQL issues
  driverFactory: () => {
    const SqliteDriver = require('@cubejs-backend/sqlite-driver');
    return new SqliteDriver({
      database: ':memory:'
    });
  },
  
  // Enable development mode
  devServer: true,
  
  // Enable development mode features
  scheduledRefreshTimer: false, // Disable in development
};
