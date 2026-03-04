const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const authMiddleware = require('../middleware/auth');
const PredictionLog = require('../models/PredictionLog');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ML Service URLs (full_service_quality)
const ML_FACTORY_TYPE_SERVICE = process.env.ML_FACTORY_TYPE_SERVICE || process.env.ML_IMAGE_SERVICE || 'http://localhost:5000';
const ML_BEST_GRADE_SERVICE = process.env.ML_BEST_GRADE_SERVICE || process.env.ML_QUALITY_SERVICE || process.env.ML_GRADING_SERVICE || 'http://localhost:5001';
const ML_CUSTOMER_SERVICE = process.env.ML_CUSTOMER_SERVICE || 'http://localhost:5002';

const normalizeDistrictForWeather = (district = '') => {
  const trimmed = String(district).trim();
  if (!trimmed) return 'Galle';

  const normalizeMap = {
    Hambanthota: 'Hambantota',
    hambanthota: 'Hambantota',
    hambantota: 'Hambantota',
    Galle: 'Galle',
    galle: 'Galle',
    Matara: 'Matara',
    matara: 'Matara',
  };

  return normalizeMap[trimmed] || trimmed;
};

const mapRipenessToDays = (ripenessStage = '') => {
  const normalized = String(ripenessStage).toLowerCase();
  if (normalized.includes('green') || normalized.includes('unripe')) return 4;
  if (normalized.includes('half') || normalized.includes('semi')) return 2;
  if (normalized.includes('ripe') || normalized.includes('ready')) return 1;
  return 2;
};

const mapColorRatiosToColor = (colorRatios = {}) => {
  const green = Number(colorRatios.green || 0);
  const yellow = Number(colorRatios.yellow || 0);
  const orange = Number(colorRatios.orange || 0);

  if (green >= yellow && green >= orange) return 'Green';
  if (yellow >= green && yellow >= orange) return 'Yellow';
  return 'Orange';
};

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

    // Factory Outlet - Use IM service only
    if (quality_category === 'factory outlet') {
      try {
        const imageFormData = new FormData();
        imageFormData.append('image', req.file.buffer, {
          filename: 'papaya.jpg',
          contentType: req.file.mimetype,
        });

        console.log('Calling factory type service at:', `${ML_FACTORY_TYPE_SERVICE}/predict-papaya-type`);
        
        const imageResponse = await axios.post(
          `${ML_FACTORY_TYPE_SERVICE}/predict-papaya-type`,
          imageFormData,
          {
            headers: imageFormData.getHeaders(),
            timeout: 30000,
          }
        );

        const imageAnalysis = imageResponse.data;
        
        console.log('\n==========================================');
        console.log('IM SERVICE RESPONSE RECEIVED');
        console.log('==========================================');
        console.log('Full response:', JSON.stringify(imageAnalysis, null, 2));
        console.log('------------------------------------------');
        console.log('prediction VALUE:', imageAnalysis.prediction);
        console.log('prediction TYPE:', typeof imageAnalysis.prediction);
        console.log('prediction LENGTH:', imageAnalysis.prediction?.length);
        console.log('prediction EXACT:', `"${imageAnalysis.prediction}"`);
        console.log('Is "Type A"?:', imageAnalysis.prediction === 'Type A');
        console.log('Is "Type B"?:', imageAnalysis.prediction === 'Type B');
        console.log('==========================================\n');
        
        // Build response from IM service
        const response = {
          prediction: imageAnalysis.prediction,
          confidence: imageAnalysis.confidence,
          explanation: imageAnalysis.explanation,
          quality_category: quality_category,
        };

        console.log('\n==========================================');
        console.log('SENDING TO FRONTEND');
        console.log('==========================================');
        console.log('Full response:', JSON.stringify(response, null, 2));
        console.log('response.prediction:', response.prediction);
        console.log('==========================================\n');

        // Log prediction
        await PredictionLog.create({
          userId: req.user.uid,
          type: 'farmer_quality',
          input: {
            farmer_id,
            quality_category,
          },
          output: response,
        });

        return res.json(response);
      } catch (imageError) {
        console.error('Image analysis error:', imageError.message);
        console.error('Error details:', imageError.response?.data || imageError);
        return res.status(500).json({ 
          error: 'Image analysis failed. Please ensure the IM service is running on port 5001.',
          details: imageError.message
        });
      }
    }

    // Best Quality - Use ML grading service
    const districtMap = {
      'Hambanthota': 0,
      'Galle': 1,
      'Matara': 2
    };

    const varietyMap = {
      'RedLady': 0,
      'Solo': 1,
      'Tenim': 1,
      'Tainung': 1
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
        `${ML_BEST_GRADE_SERVICE}/predict-papaya-grade`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000,
        }
      );

      mlResponse = mlServiceResponse.data;
    } catch (mlError) {
      console.error('Best quality ML service error:', mlError.message);
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
    const bestExplanation =
      typeof mlResponse.explanation === 'string'
        ? mlResponse.explanation
        : (mlResponse.explanation?.explanation || 'No detailed explanation available.');

    const response = {
      predicted_grade: mlResponse.predicted_grade,
      confidence: mlResponse.confidence,
      all_probabilities: mlResponse.all_probabilities,
      extracted_color: mlResponse.extracted_color,
      explanation: bestExplanation,
      feature_contributions: mlResponse.explanation?.feature_contributions || [],
      top_features: mlResponse.explanation?.top_features || [],
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
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const city = normalizeDistrictForWeather(req.body.city || req.user?.district || 'Galle');

    const customerFormData = new FormData();
    customerFormData.append('city', city);
    customerFormData.append('image', req.file.buffer, {
      filename: 'papaya.jpg',
      contentType: req.file.mimetype,
    });

    const customerServiceResponse = await axios.post(
      `${ML_CUSTOMER_SERVICE}/predict-customer-recomandations`,
      customerFormData,
      {
        headers: customerFormData.getHeaders(),
        timeout: 45000,
      }
    );

    const mlOutput = customerServiceResponse.data || {};
    const predictions = mlOutput.predictions || {};
    const weather = mlOutput.weather_last_7_days || {};
    const colorRatios = mlOutput.color_ratios || {};

    const response = {
      color: mapColorRatiosToColor(colorRatios),
      variety: 'N/A',
      ripen_days: mapRipenessToDays(predictions.ripeness_stage),
      grade: String(predictions.quality_grade || '3'),
      average_temperature: Number(weather.avg_temp || 0),
      city,
      ripeness_stage: predictions.ripeness_stage,
      taste: predictions.taste,
      buying_recommendation: predictions.buying_recommendation,
      weather_last_7_days: weather,
      color_ratios: colorRatios,
      final_suggestion: mlOutput.final_suggestion,
      papaya_probability: mlOutput.papaya_probability,
    };

    // Log prediction
    await PredictionLog.create({
      userId: req.user.uid,
      type: 'customer_quality',
      input: { city },
      output: response,
    });

    res.json(response);
  } catch (error) {
    console.error('Customer quality error:', error);
    res.status(500).json({
      error: 'Failed to check papaya quality',
      details: error.response?.data?.error || error.message,
    });
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
