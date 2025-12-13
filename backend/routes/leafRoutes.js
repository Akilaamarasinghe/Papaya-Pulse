const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const PredictionLog = require('../models/PredictionLog');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/leaf/predict - Leaf disease prediction
router.post('/predict', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // TODO: Integrate with ML model for actual disease detection
    // The ML model should be hosted separately and called via HTTP/gRPC
    // For now, return mock response

    const diseases = ['Anthracnose', 'Curl', 'Healthy', 'Mite disease', 'Ringspot', 'NotPapaya'];
    const severities = ['mild', 'moderate', 'severe'];

    const disease = diseases[Math.floor(Math.random() * diseases.length)];
    const diseaseConfidence = 0.75 + Math.random() * 0.24; // 75-99%

    let severity = 'unknown';
    let severityConfidence = 0;

    if (disease !== 'Healthy' && disease !== 'NotPapaya') {
      severity = severities[Math.floor(Math.random() * severities.length)];
      severityConfidence = 0.70 + Math.random() * 0.29; // 70-99%
    }

    const response = {
      disease,
      disease_confidence: diseaseConfidence,
      severity,
      severity_confidence: severityConfidence,
    };

    // Log prediction
    await PredictionLog.create({
      userId: req.user.uid,
      type: 'leaf_disease',
      input: { hasImage: true },
      output: response,
    });

    res.json(response);
  } catch (error) {
    console.error('Leaf disease prediction error:', error);
    res.status(500).json({ error: 'Failed to predict leaf disease' });
  }
});

// GET /api/leaf/history - Get leaf disease prediction history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await PredictionLog.find({
      userId: req.user.uid,
      type: 'leaf_disease',
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(history);
  } catch (error) {
    console.error('Leaf disease history error:', error);
    res.status(500).json({ error: 'Failed to get disease history' });
  }
});

module.exports = router;
