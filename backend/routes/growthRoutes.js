const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const PredictionLog = require('../models/PredictionLog');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ML Service URLs
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5009';
const ML_STAGE_SERVICE_URL = process.env.ML_STAGE_SERVICE_URL || 'http://localhost:5008';

// POST /api/growth/stage - Growth stage check (image processing ML)
router.post('/stage', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Forward image to image-processing ML service on port 5008
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'plant.jpg',
      contentType: req.file.mimetype || 'image/jpeg',
    });

    // Optional: forward location/month/language if provided
    if (req.body.location) form.append('location', req.body.location);
    if (req.body.month) form.append('month', req.body.month);
    form.append('language', req.body.language || 'en');

    let mlData;
    try {
      const mlResponse = await axios.post(
        `${ML_STAGE_SERVICE_URL}/predict`,
        form,
        {
          headers: form.getHeaders(),
          timeout: 60000,
        }
      );
      mlData = mlResponse.data;
    } catch (mlError) {
      console.error('ML Stage Service error:', mlError.response?.data || mlError.message);
      if (mlError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Growth stage ML service is not available. Please ensure the image processing service is running on port 5008.',
        });
      }
      throw mlError;
    }

    // Log prediction (non-blocking)
    PredictionLog.create({
      userId: req.user.uid,
      type: 'growth_stage',
      input: { hasImage: true },
      output: mlData,
    }).catch(dbErr => console.warn('PredictionLog save failed (non-fatal):', dbErr.message));

    res.json(mlData);
  } catch (error) {
    console.error('Growth stage error:', error);
    res.status(500).json({ error: 'Failed to analyze growth stage' });
  }
});

// POST /api/growth/harvest - Harvest prediction
router.post('/harvest', authMiddleware, async (req, res) => {
  try {
    const {
      district,
      soil_type,
      watering_method,
      watering_frequency,
      trees_count,
      plant_month,
    } = req.body;

    // Validate required fields
    if (!district || !soil_type || !watering_method || !watering_frequency || !trees_count || !plant_month) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Call Python ML service
    const mlPayload = {
      district: district.toLowerCase(),
      soil_type: soil_type.toLowerCase().replace(/_/g, ' '),  // convert underscores → spaces to match SOIL_MAP
      watering_method: watering_method.toLowerCase(),
      watering_frequency: parseInt(watering_frequency),
      trees_count: parseInt(trees_count),
      plant_month: parseInt(plant_month),
      language: req.body.language || 'en',
    };

    console.log('Calling ML service with:', mlPayload);

    try {
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/growth_predict`,
        mlPayload,
        { timeout: 30000 }
      );

      const response = mlResponse.data;

      // Log prediction (non-blocking – don't fail request if DB is down)
      PredictionLog.create({
        userId: req.user.uid,
        type: 'harvest',
        input: req.body,
        output: response,
      }).catch(dbErr => console.warn('PredictionLog save failed (non-fatal):', dbErr.message));

      res.json(response);
    } catch (mlError) {
      console.error('ML Service error:', mlError.response?.data || mlError.message);
      
      // If ML service is down, return informative error
      if (mlError.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          error: 'ML prediction service is not available. Please ensure Python ML service is running on port 5009.' 
        });
      }
      
      throw mlError;
    }
  } catch (error) {
    console.error('Harvest prediction error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate harvest prediction',
      details: error.response?.data?.error || error.message 
    });
  }
});

module.exports = router;
