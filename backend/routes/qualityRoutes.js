const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const authMiddleware = require('../middleware/auth');
const PredictionLog = require('../models/PredictionLog');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ML Service URL - New ML service for quality grading
const ML_QUALITY_SERVICE = process.env.ML_QUALITY_SERVICE || 'http://localhost:5000';

// POST /api/quality/farmer - Farmer quality grading
router.post('/farmer', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const {
      farmer_id,
      district,
      variety,
      maturity,
      quality_category,
      days_since_picked,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Map frontend values to ML service format
    const districtMap = {
      'Hambanthota': 0,
      'Galle': 1,
      'Matara': 2
    };

    const varietyMap = {
      'RedLady': 0,
      'Solo': 1,
      'Tenim': 1 // Map Tenim to Solo for now
    };

    const maturityMap = {
      'unmature': 0,
      'half-mature': 1,
      'mature': 2
    };

    // Call the new ML quality service
    let mlResponse;
    try {
      const formData = new FormData();
      
      // Prepare the data JSON payload
      const dataPayload = {
        district: districtMap[district] || 1,
        variety: varietyMap[variety] || 0,
        maturity: maturityMap[maturity] || 2,
        days_since_plucked: parseInt(days_since_picked) || 1,
      };

      formData.append('data', JSON.stringify(dataPayload));
      formData.append('file', req.file.buffer, {
        filename: 'papaya.jpg',
        contentType: req.file.mimetype,
      });

      const mlServiceResponse = await axios.post(
        `${ML_QUALITY_SERVICE}/predict`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000,
        }
      );

      mlResponse = mlServiceResponse.data;
    } catch (mlError) {
      console.error('ML service error:', mlError.message);
      // Fallback to mock grading if ML service fails
      const damageProbabilities = {
        'unmature': 0.15,
        'half-mature': 0.25,
        'mature': 0.35,
      };
      const baseProb = damageProbabilities[maturity] || 0.25;
      const ageEffect = parseInt(days_since_picked) > 3 ? 0.15 : 0;
      const damageProbability = Math.min(baseProb + ageEffect, 0.95);

      let grade;
      if (damageProbability < 0.2) grade = '1';
      else if (damageProbability < 0.4) grade = '2';
      else grade = '3';

      mlResponse = {
        predicted_grade: grade,
        confidence: 1 - damageProbability,
        all_probabilities: {
          '1': 0.33,
          '2': 0.33,
          '3': 0.34
        },
        extracted_color: '#f09439',
        explanation: {
          explanation: `Based on maturity level and days since picked, the fruit quality is estimated as Grade ${grade}.`,
          feature_contributions: [],
          top_features: []
        }
      };
    }

    // Build response using new ML service data
    const response = {
      predicted_grade: mlResponse.predicted_grade,
      confidence: mlResponse.confidence,
      all_probabilities: mlResponse.all_probabilities,
      extracted_color: mlResponse.extracted_color,
      explanation: mlResponse.explanation.explanation,
      feature_contributions: mlResponse.explanation.feature_contributions,
      top_features: mlResponse.explanation.top_features,
      quality_category: quality_category,
    };

    // Log prediction
    await PredictionLog.create({
      userId: req.user.uid,
      type: 'farmer_quality',
      input: {
        ...req.body,
        district_code: districtMap[district],
        variety_code: varietyMap[variety],
        maturity_code: maturityMap[maturity],
      },
      output: response,
    });

    res.json(response);
  } catch (error) {
    console.error('Farmer quality error:', error);
    res.status(500).json({ error: 'Failed to grade papaya quality' });
  }
});

// GET /api/quality/farmer/history - Get farmer quality history
router.get('/farmer/history', authMiddleware, async (req, res) => {
  try {
    const history = await PredictionLog.find({
      userId: req.user.uid,
      type: 'farmer_quality',
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(history);
  } catch (error) {
    console.error('Farmer quality history error:', error);
    res.status(500).json({ error: 'Failed to get quality history' });
  }
});

// POST /api/quality/customer - Customer quality check
router.post('/customer', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { weight } = req.body;

    // TODO: Integrate with ML model for actual quality check
    // For now, return mock response

    const colors = ['Yellow-orange', 'Orange', 'Yellow-green', 'Golden yellow'];
    const varieties = ['RedLady', 'Solo', 'Tainung'];
    const grades = ['I', 'II', 'III'];

    const color = colors[Math.floor(Math.random() * colors.length)];
    const variety = varieties[Math.floor(Math.random() * varieties.length)];
    const ripenDays = Math.floor(Math.random() * 5);
    const grade = grades[Math.floor(Math.random() * grades.length)];
    const avgTemperature = 24 + Math.random() * 4;

    const response = {
      color,
      variety,
      ripen_days: ripenDays,
      grade,
      average_temperature: avgTemperature,
    };

    // Log prediction
    await PredictionLog.create({
      userId: req.user.uid,
      type: 'customer_quality',
      input: { weight },
      output: response,
    });

    res.json(response);
  } catch (error) {
    console.error('Customer quality error:', error);
    res.status(500).json({ error: 'Failed to check papaya quality' });
  }
});

// GET /api/quality/customer/history - Get customer quality history
router.get('/customer/history', authMiddleware, async (req, res) => {
  try {
    const history = await PredictionLog.find({
      userId: req.user.uid,
      type: 'customer_quality',
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(history);
  } catch (error) {
    console.error('Customer quality history error:', error);
    res.status(500).json({ error: 'Failed to get quality history' });
  }
});

module.exports = router;
