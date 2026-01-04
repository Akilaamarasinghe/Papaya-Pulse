const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const PredictionLog = require('../models/PredictionLog');

// Python ML service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

// POST /api/market/predict - Market price prediction (Farmers only)
router.post('/predict', authMiddleware, async (req, res) => {
  try {
    // Check if user is a farmer
    const user = await User.findOne({ uid: req.user.uid });
    if (!user || user.role !== 'farmer') {
      return res.status(403).json({ error: 'This feature is only available for farmers' });
    }

    const {
      district,
      variety,
      cultivation_method,
      quality_grade,
      total_harvest_count,
      avg_weight_per_fruit,
      expected_selling_date,
    } = req.body;

    // Determine which endpoint to use based on quality grade
    const isBestQuality = ['I', 'II', 'III'].includes(quality_grade);
    const endpoint = isBestQuality ? '/martket_data_predict' : '/factory_outlet_price_predict';

    // Map expected_selling_date to expect_selling_week
    const sellingWeekMap = {
      'today': 0,
      '1day': 0,
      '2day': 1,
      '3day': 1,
      '4day': 2,
      '5day': 2,
    };

    // Prepare data for ML service
    const mlRequestData = {
      district: district,
      variety: variety,
      cultivation_methode: cultivation_method, // Note: ML service uses 'methode' spelling
      quality: quality_grade,
      total_harvest_papaya_units_count: total_harvest_count,
      avg_weight_kg: avg_weight_per_fruit,
      expect_selling_week: sellingWeekMap[expected_selling_date] || 0,
    };

    console.log(`Calling ML service: ${ML_SERVICE_URL}${endpoint}`);
    console.log('Request data:', mlRequestData);

    // Call Python ML service
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}${endpoint}`,
      mlRequestData,
      {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!mlResponse.data.success) {
      throw new Error(mlResponse.data.error || 'ML service returned failure');
    }

    const predictions = mlResponse.data.predictions;

    // Format response for frontend
    const response = {
      predicted_price_per_kg: predictions.price_per_kg,
      predicted_total_income: predictions.total_harvest_value,
      suggested_selling_day: predictions.best_selling_day,
      explanation: [
        mlResponse.data.summary || 'Market price prediction completed successfully.',
      ],
      xai_factors: mlResponse.data.xai_factors || [],
    };

    // Log prediction
    await PredictionLog.create({
      userId: req.user.uid,
      type: 'market_price',
      input: req.body,
      output: response,
    });

    res.json(response);
  } catch (error) {
    console.error('Market price prediction error:', error.message);
    
    // Check if it's a connection error to ML service
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ 
        error: 'ML service is not available. Please make sure the Python ML service is running on port 5000.' 
      });
    }

    res.status(500).json({ 
      error: error.response?.data?.error || error.message || 'Failed to predict market price' 
    });
  }
});

module.exports = router;
