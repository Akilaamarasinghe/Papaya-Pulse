const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const PredictionLog = require('../models/PredictionLog');

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

    // TODO: Integrate with ML model for actual price prediction
    // For now, return mock response based on inputs

    const basePrices = {
      'RedLady': 180,
      'Solo': 160,
      'Tenim': 170,
    };

    let pricePerKg = basePrices[variety] || 170;

    // Apply modifiers
    if (cultivation_method === 'Organic') {
      pricePerKg *= 1.25; // 25% premium for organic
    }

    if (quality_grade === 'A') {
      pricePerKg *= 1.15;
    } else if (quality_grade === 'C') {
      pricePerKg *= 0.85;
    }

    // District modifier
    const districtModifiers = {
      'Hambanthota': 1.05,
      'Matara': 0.95,
      'Galle': 1.0,
    };
    pricePerKg *= (districtModifiers[district] || 1.0);

    const totalWeight = total_harvest_count * avg_weight_per_fruit;
    const predictedTotalIncome = Math.round(totalWeight * pricePerKg);

    const sellingDays = ['In 2 days', 'Tomorrow', 'In 3 days', 'Next week', 'In 5 days'];
    const suggestedSellingDay = sellingDays[Math.floor(Math.random() * sellingDays.length)];

    const explanationOptions = [
      `${cultivation_method} method ${cultivation_method === 'Organic' ? 'increased' : 'standardized'} your price.`,
      `${variety} variety has ${variety === 'RedLady' ? 'high' : 'moderate'} market demand.`,
      `Quality grade ${quality_grade} ${quality_grade === 'A' ? 'commands premium pricing' : 'affects market value'}.`,
      `${district} district has ${districtModifiers[district] > 1 ? 'favorable' : 'standard'} market conditions.`,
      'Recent market trends show stable demand for quality papayas.',
    ];

    const response = {
      predicted_price_per_kg: Math.round(pricePerKg),
      predicted_total_income: predictedTotalIncome,
      suggested_selling_day: suggestedSellingDay,
      explanation: explanationOptions.slice(0, 4),
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
    console.error('Market price prediction error:', error);
    res.status(500).json({ error: 'Failed to predict market price' });
  }
});

module.exports = router;
