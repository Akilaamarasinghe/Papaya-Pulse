const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const PredictionLog = require('../models/PredictionLog');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/quality/farmer - Farmer quality grading
router.post('/farmer', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const {
      farmer_id,
      district,
      variety,
      maturity,
      temperature,
      days_since_picked,
    } = req.body;

    // TODO: Integrate with ML model for actual quality grading
    // For now, return mock response

    const grades = ['A', 'B', 'C'];
    const damageProbabilities = {
      'unmature': 0.15,
      'half-mature': 0.25,
      'mature': 0.35,
    };

    const baseProb = damageProbabilities[maturity] || 0.25;
    const tempEffect = parseFloat(temperature) > 28 ? 0.1 : 0;
    const ageEffect = parseInt(days_since_picked) > 3 ? 0.15 : 0;
    const damageProbability = Math.min(baseProb + tempEffect + ageEffect, 0.95);

    let grade;
    if (damageProbability < 0.2) grade = 'A';
    else if (damageProbability < 0.4) grade = 'B';
    else grade = 'C';

    const explanations = {
      'A': [
        'Minimal surface damage detected.',
        'Color is vibrant and uniform.',
        'Firmness is optimal for market.',
        'No significant bruising or blemishes.',
      ],
      'B': [
        'Small bruises near stem area.',
        'Color still acceptable for market.',
        'Minor surface damage visible.',
        'Overall quality is good but not premium.',
      ],
      'C': [
        'Significant surface damage detected.',
        'Multiple bruises and blemishes.',
        'Color variation affecting appearance.',
        'Consider quick sale or processing.',
      ],
    };

    const response = {
      grade,
      damage_probability: damageProbability,
      explanation: explanations[grade],
    };

    // Log prediction
    await PredictionLog.create({
      userId: req.user.uid,
      type: 'farmer_quality',
      input: req.body,
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
    const grades = ['A', 'B', 'C'];

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
