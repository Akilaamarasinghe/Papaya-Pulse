require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Import routes
const userRoutes = require('./routes/userRoutes');
const growthRoutes = require('./routes/growthRoutes');
const qualityRoutes = require('./routes/qualityRoutes');
const marketRoutes = require('./routes/marketRoutes');
const leafRoutes = require('./routes/leafRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
const _allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:19006',
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // Wildcard passthrough when explicitly configured
      if (_allowedOrigins.includes('*')) return callback(null, true);
      if (_allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Papaya Pulse API Server',
    version: '1.0.0',
    status: 'running',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/leaf', leafRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Papaya Pulse API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`📱 Mobile access: Find your IP with 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)`);
  console.log(`   Then use: http://YOUR_IP:${PORT}`);
});
