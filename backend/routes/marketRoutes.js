const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const PredictionLog = require('../models/PredictionLog');

// Python ML service URLs
const FARMER_ML_URL = process.env.FARMER_ML_SERVICE_URL || 'http://localhost:5003';
const CUSTOMER_ML_URL = process.env.CUSTOMER_ML_SERVICE_URL || 'http://localhost:5004';

// Multer – keep uploaded images in memory so we can forward them
const upload = multer({ storage: multer.memoryStorage() });

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

    console.log(`Calling Farmer ML service: ${FARMER_ML_URL}${endpoint}`);
    console.log('Request data:', mlRequestData);

    // Call Python ML service
    const mlResponse = await axios.post(
      `${FARMER_ML_URL}${endpoint}`,
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
        error: 'Farmer ML service is not available. Please make sure the Python ML service is running on port 5003.' 
      });
    }

    res.status(500).json({ 
      error: error.response?.data?.error || error.message || 'Failed to predict market price' 
    });
  }
});

// POST /api/market/customer-predict - Customer papaya image analysis (port 5004)
router.post('/customer-predict', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const { city, seller_price } = req.body;

    if (!city) {
      return res.status(400).json({ error: 'City/district is required' });
    }

    // Build multipart form to forward to the Python 5004 service
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'papaya.jpg',
      contentType: req.file.mimetype || 'image/jpeg',
    });
    formData.append('city', city);
    if (seller_price) {
      formData.append('seller_price', seller_price);
    }

    console.log(`Calling Customer ML service: ${CUSTOMER_ML_URL}/sachini-cus-predict`);

    const mlResponse = await axios.post(
      `${CUSTOMER_ML_URL}/sachini-cus-predict`,
      formData,
      {
        timeout: 60000,
        headers: formData.getHeaders(),
      }
    );

    const result = mlResponse.data;

    // Log the prediction
    await PredictionLog.create({
      userId: req.user.uid,
      type: 'market_price',
      input: { city, seller_price: seller_price || null },
      output: result,
    });

    res.json(result);
  } catch (error) {
    console.error('Customer market predict error:', error.message);

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        error: 'Customer ML service is not available. Please make sure the Python ML service is running on port 5004.',
      });
    }

    // Propagate "Not a papaya" error clearly
    const mlError = error.response?.data?.error;
    if (mlError === 'Not a papaya') {
      return res.status(400).json({ error: 'The uploaded image does not appear to be a papaya. Please take a clearer photo.' });
    }

    res.status(500).json({
      error: mlError || error.message || 'Failed to analyse papaya image',
    });
  }
});

module.exports = router;
