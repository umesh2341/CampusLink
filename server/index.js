import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db/pool.js';
import buildingRoutes from './routes/buildingRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/buildings', buildingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/search', searchRoutes);

// Basic health check route
app.get('/api/health', async (req, res) => {
  try {
    // Try executing a simple query to verify db pool connectivity
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
