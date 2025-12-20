const mongoose = require('mongoose');

const predictionLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['growth_stage', 'harvest', 'farmer_quality', 'customer_quality', 'market_price', 'leaf_disease'],
    required: true,
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  output: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

predictionLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PredictionLog', predictionLogSchema);
