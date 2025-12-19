const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const PredictionLog = require('../models/PredictionLog');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ML Service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

// POST /api/growth/stage - Growth stage check
router.post('/stage', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    // TODO: Integrate with ML model for actual growth stage detection
    // For now, return mock response
    
    const mockStages = ['A', 'B', 'C', 'D'];
    const stage = mockStages[Math.floor(Math.random() * mockStages.length)];

    const response = {
      stage,
      advice: [
        `Your plant is on stage ${stage}.`,
        `To reach the next stage: water consistently, add fertilizer every 1½ weeks.`,
        'Ensure adequate sunlight (6-8 hours daily).',
        'Monitor for pests and diseases regularly.',
        'Maintain soil pH between 6.0-6.5 for optimal growth.',
      ],
    };

    // Log prediction
    await PredictionLog.create({
      userId: req.user.uid,
      type: 'growth_stage',
      input: { hasImage: !!req.file },
      output: response,
    });

    res.json(response);
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
      soil_type: soil_type.toLowerCase().replace(/ /g, '_'),
      watering_method: watering_method.toLowerCase(),
      watering_frequency: parseInt(watering_frequency),
      trees_count: parseInt(trees_count),
      plant_month: parseInt(plant_month),
    };

    console.log('Calling ML service with:', mlPayload);

    try {
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/growth_predict`,
        mlPayload,
        { timeout: 30000 }
      );

      const response = mlResponse.data;

      // Log prediction
      await PredictionLog.create({
        userId: req.user.uid,
        type: 'harvest',
        input: req.body,
        output: response,
      });

      res.json(response);
    } catch (mlError) {
      console.error('ML Service error:', mlError.response?.data || mlError.message);
      
      // If ML service is down, return informative error
      if (mlError.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          error: 'ML prediction service is not available. Please ensure Python ML service is running on port 5000.' 
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
