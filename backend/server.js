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
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
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
app.listen(PORT, () => {
  console.log(`🚀 Papaya Pulse API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});
