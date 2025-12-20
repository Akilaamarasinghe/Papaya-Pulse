const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const authMiddleware = require('../middleware/auth');
const PredictionLog = require('../models/PredictionLog');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ML Service URLs
const ML_GRADING_SERVICE = process.env.ML_GRADING_SERVICE || 'http://localhost:5000';
const ML_IMAGE_SERVICE = process.env.ML_IMAGE_SERVICE || 'http://localhost:5001';

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

    // Step 1: Send image to IM service for color and texture analysis
    let imageAnalysis;
    try {
      const imageFormData = new FormData();
      imageFormData.append('image', req.file.buffer, {
        filename: 'papaya.jpg',
        contentType: req.file.mimetype,
      });

      const imageResponse = await axios.post(
        `${ML_IMAGE_SERVICE}/predict`,
        imageFormData,
        {
          headers: imageFormData.getHeaders(),
          timeout: 30000,
        }
      );

      imageAnalysis = imageResponse.data;
    } catch (imageError) {
      console.error('Image analysis error:', imageError.message);
      // Fallback to default values if image service fails
      imageAnalysis = {
        prediction: 'Type A',
        confidence: '75%',
        explanation: 'Using default analysis due to service unavailability'
      };
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

    // Determine color and texture from image type
    const color = imageAnalysis.prediction === 'Type A' ? '#f09439' : '#e47647';
    const texture = imageAnalysis.prediction === 'Type A' ? '75.0' : '65.0';

    // Step 2: Send data to ML grading service
    let mlGrading;
    try {
      const gradingPayload = {
        district: districtMap[district] || 1,
        variety: varietyMap[variety] || 0,
        color: color,
        texture: texture,
        maturity: parseFloat(maturity) || 75.0,
        damage: imageAnalysis.prediction === 'Type B' ? 3.0 : 1.0,
      };

      const gradingResponse = await axios.post(
        `${ML_GRADING_SERVICE}/papaya_grade_predict`,
        gradingPayload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      mlGrading = gradingResponse.data;
    } catch (gradingError) {
      console.error('Grading error:', gradingError.message);
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
      if (damageProbability < 0.2) grade = 'I';
      else if (damageProbability < 0.4) grade = 'II';
      else grade = 'III';

      mlGrading = {
        prediction_label: grade === 'I' ? 'Grade 1 (Best)' : grade === 'II' ? 'Grade 2 (Medium)' : 'Grade 3 (Lowest)',
        prediction_confidence_percent: `${(100 - damageProbability * 100).toFixed(2)}%`,
        farmer_friendly_explanation: `Based on maturity level and days since picked, the fruit quality is estimated as ${grade}.`
      };
    }

    // Map ML prediction to our grade system (I, II, III)
    let grade;
    if (mlGrading.prediction_label.includes('Grade 1') || mlGrading.prediction_label.includes('Best')) {
      grade = 'I';
    } else if (mlGrading.prediction_label.includes('Grade 2') || mlGrading.prediction_label.includes('Medium')) {
      grade = 'II';
    } else {
      grade = 'III';
    }

    // Extract confidence percentage
    const confidenceMatch = mlGrading.prediction_confidence_percent?.match(/([0-9.]+)/);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) / 100 : 0.85;

    // Build explanation array
    const explanation = [
      mlGrading.farmer_friendly_explanation || 'Quality analysis completed.',
      `Image Analysis: ${imageAnalysis.explanation || imageAnalysis.prediction}`,
      `Confidence: ${mlGrading.prediction_confidence_percent || '85%'}`,
      quality_category === 'Best Quality' 
        ? 'Selected for best quality market segment.'
        : 'Selected for factory outlet segment.',
    ];

    if (mlGrading.temperature_used) {
      explanation.push(`Average temperature considered: ${mlGrading.temperature_used}°C`);
    }

    const response = {
      grade,
      damage_probability: 1 - confidence,
      explanation,
    };

    // Log prediction
    await PredictionLog.create({
      userId: req.user.uid,
      type: 'farmer_quality',
      input: {
        ...req.body,
        image_analysis: imageAnalysis.prediction,
        ml_grade: mlGrading.prediction_label,
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
