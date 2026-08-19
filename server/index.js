import 'dotenv/config'; // Must be first to populate process.env for imported modules
import express from 'express';
import cors from 'cors';
import os from 'os';
import pool from './db/pool.js';
import buildingRoutes from './routes/buildingRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/buildings', buildingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/uploads', uploadRoutes);

// Basic health check route
app.get('/api/health', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      timestamp: new Date(),
      database: 'Connected',
      dbTime: dbCheck.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date(),
      database: 'Disconnected',
      error: error.message
    });
  }
});

// Helper to log network URLs
const logNetworkUrls = (port) => {
  console.log(`\n  Express Backend Server Ready`);
  console.log(`  ➜  Local:   http://localhost:${port}/`);
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  ➜  Network: http://${net.address}:${port}/`);
      }
    }
  }
  console.log('');
};

// Start server listening on 0.0.0.0 for network access
app.listen(PORT, '0.0.0.0', () => {
  logNetworkUrls(PORT);
});
