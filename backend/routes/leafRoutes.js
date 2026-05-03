const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const authMiddleware = require('../middleware/auth');
const PredictionLog = require('../models/PredictionLog');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const LEAF_ML_SERVICE_URL = process.env.LEAF_ML_SERVICE_URL || 'http://localhost:5005';
const LEAF_ML_TIMEOUT = Number(process.env.LEAF_ML_TIMEOUT || 45000);

const parseProbability = (value) => {
  if (typeof value === 'number') {
    if (value > 1) {
      return Math.min(value / 100, 1); 
    }
    return Math.max(value, 0);
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/%/g, '').trim();
    const parsed = parseFloat(cleaned);
    if (!Number.isNaN(parsed)) {
      return parsed > 1 ? Math.min(parsed / 100, 1) : Math.max(parsed, 0);
    }
  }

  return 0;
};

const mapDiseaseLabel = (label, isLeaf) => {
  if (!isLeaf) {
    return 'NotPapaya';
  }

  if (!label) {
    return 'Healthy';
  }

  const normalized = label.toString().toLowerCase();

  if (normalized.includes('anth')) {
    return 'Anthracnose';
  }
  if (normalized.includes('curl')) {
    return 'Curl';
  }
  if (normalized.includes('mite')) {
    return 'Mite disease';
  }
  if (normalized.includes('mosaic')) {
    return 'Mosaic virus';
  }
  if (normalized.includes('healthy')) {
    return 'Healthy';
  }

  return 'Healthy';
};

const mapStageToSeverity = (stageLabel) => {
  if (!stageLabel) {
    return 'unknown';
  }

  const normalized = stageLabel.toString().toLowerCase();

  if (
    normalized.includes('mild') ||
    normalized.includes('early') ||
    normalized.includes('initial') ||
    normalized.includes('stage_1') ||
    normalized.includes('stage 1')
  ) {
    return 'mild';
  }

  if (
    normalized.includes('moderate') ||
    normalized.includes('medium') ||
    normalized.includes('mid') ||
    normalized.includes('stage_2') ||
    normalized.includes('stage 2')
  ) {
    return 'moderate';
  }

  if (
    normalized.includes('severe') ||
    normalized.includes('late') ||
    normalized.includes('advanced') ||
    normalized.includes('stage_3') ||
    normalized.includes('stage 3')
  ) {
    return 'severe';
  }

  return 'unknown';
};

const transformPrediction = (raw) => {
  const isLeaf = Boolean(raw?.is_leaf);
  const disease = mapDiseaseLabel(raw?.disease, isLeaf);
  const base = {
    disease,
    disease_confidence: parseProbability(
      isLeaf ? raw?.disease_prob || raw?.leaf_prob : raw?.not_leaf_prob || 1
    ),
    severity: 'unknown',
    severity_confidence: 0,
    is_leaf: isLeaf,
    leaf_confidence: parseProbability(raw?.leaf_prob),
    not_leaf_confidence: parseProbability(raw?.not_leaf_prob),
    stage_label: raw?.stage || null,
    stage_confidence: 0,
    model_metadata: {
      model_version: raw?.model_version || null,
      inference_time_ms: raw?.inference_time_ms || null,
      served_by: 'papaya-leaf-disease-ml-part',
    },
    raw_payload: raw || null,
  };

  if (!isLeaf) {
    return base;
  }

  if (disease === 'Healthy') {
    return base;
  }

  const severity = mapStageToSeverity(raw?.stage);
  const severityConfidence = severity === 'unknown' ? 0 : parseProbability(raw?.stage_prob);

  return {
    ...base,
    severity,
    severity_confidence: severityConfidence,
    stage_confidence: severityConfidence,
  };
};

// POST /api/leaf/predict - Leaf disease prediction
router.post('/predict', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname || 'leaf.jpg',
      contentType: req.file.mimetype || 'image/jpeg',
      knownLength: req.file.size,
    });

    let mlData;

    try {
      const mlResponse = await axios.post(
        `${LEAF_ML_SERVICE_URL}/predict`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: LEAF_ML_TIMEOUT,
        }
      );

      mlData = mlResponse.data;
    } catch (mlError) {
      console.error('Leaf ML service error:', mlError.response?.data || mlError.message);

      if (mlError.code === 'ECONNREFUSED' || mlError.code === 'ENOTFOUND') {
        return res.status(503).json({
          error: 'Leaf disease model is not reachable. Ensure the Flask service is running.',
        });
      }

      if (mlError.response?.status) {
        return res.status(mlError.response.status).json({
          error: mlError.response.data?.error || 'Leaf disease model returned an error',
        });
      }

      throw mlError;
    }

    const response = transformPrediction(mlData);

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

// POST /api/leaf/recommend - Get fertilizer + AI advice recommendation
const SUPPORTED_LEAF_DISTRICTS = ['galle', 'matara', 'hambantota'];

router.post('/recommend', authMiddleware, async (req, res) => {
  try {
    const { disease, severity, growth_stage, soil_type, district, include_ai_advice } = req.body;

    if (!disease || !severity || !growth_stage) {
      return res.status(400).json({ error: 'disease, severity, and growth_stage are required' });
    }

    // ML service only supports Southern Province – fall back to galle for other districts
    const normalizedDistrict = (district || '').toLowerCase().trim();
    const safeDistrict = SUPPORTED_LEAF_DISTRICTS.includes(normalizedDistrict)
      ? normalizedDistrict
      : 'galle';

    const mlResponse = await axios.post(
      `${LEAF_ML_SERVICE_URL}/recommend`,
      { disease, severity, growth_stage, soil_type: soil_type || 'sandy_loam', district: safeDistrict, include_ai_advice: include_ai_advice !== false },
      { timeout: LEAF_ML_TIMEOUT }
    );

    res.json(mlResponse.data);
  } catch (error) {
    console.error('Leaf recommend error:', error.response?.data || error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ error: 'Failed to get leaf disease recommendation' });
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
