const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const PredictionLog = require('../models/PredictionLog');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
      watering_frequency_per_week,
      trees_count,
      planted_month,
    } = req.body;

    // TODO: Integrate with ML model for actual harvest prediction
    // For now, return mock response based on inputs

    const baseYield = 30;
    const yieldVariation = Math.random() * 10;
    const yieldPerTree = baseYield + yieldVariation;

    const baseDays = 220;
    const daysVariation = Math.floor(Math.random() * 40);
    const harvestDaysTotal = baseDays + daysVariation;
    const harvestDaysRemaining = Math.floor(harvestDaysTotal * (Math.random() * 0.5 + 0.5));

    const avgTemp = district === 'Hambanthota' ? 26.5 : district === 'Matara' ? 25.2 : 25.8;
    const avgRainfall = district === 'Hambanthota' ? 950 : district === 'Matara' ? 1200 : 1050;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

    const response = {
      farmer_explanation: [
        `Your papaya trees are expected to produce about ${yieldPerTree.toFixed(1)} kg per tree.`,
        'Here is why:',
        `- Planting in ${monthNames[planted_month - 1]} influenced growth (seasonal impact).`,
        `- ${watering_method} irrigation method affects water efficiency.`,
        `- ${soil_type} provides specific nutrient availability.`,
        '',
        `The estimated harvest time is around ${harvestDaysTotal} days.`,
        'Why harvest takes this long:',
        `- Temperature (${avgTemp.toFixed(2)} celsius) affects fruit development speed.`,
        `- Rainfall (${avgRainfall.toFixed(1)} mm) influences flowering and growth.`,
        `- Planting month (${monthNames[planted_month - 1]}) affects seasonal growth rate.`,
      ],
      predictions: {
        harvest_days_remaining: harvestDaysRemaining,
        harvest_days_total: harvestDaysTotal,
        yield_per_tree: yieldPerTree,
      },
    };

    // Log prediction
    await PredictionLog.create({
      userId: req.user.uid,
      type: 'harvest',
      input: req.body,
      output: response,
    });

    res.json(response);
  } catch (error) {
    console.error('Harvest prediction error:', error);
    res.status(500).json({ error: 'Failed to predict harvest' });
  }
});

module.exports = router;
