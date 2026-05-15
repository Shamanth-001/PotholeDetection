/**
 * AI Service Client — Communicates with Python FastAPI microservice
 */
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const logger = require('../utils/logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = 30000;

/**
 * Send image to AI service for analysis
 * @param {string|Buffer} imageInput - File path or buffer
 * @param {string} issueType - The type of issue reported (e.g. 'pothole', 'garbage')
 */
exports.analyzeImage = async (imageInput, issueType) => {
  try {
    const formData = new FormData();

    if (typeof imageInput === 'string') {
      formData.append('file', fs.createReadStream(imageInput));
    } else if (Buffer.isBuffer(imageInput)) {
      formData.append('file', imageInput, { filename: 'upload.jpg', contentType: 'image/jpeg' });
    } else {
      throw new Error('Invalid image input: expected file path or buffer');
    }

    if (issueType) {
      formData.append('issue_type', issueType);
    }

    const response = await axios.post(`${AI_SERVICE_URL}/analyze`, formData, {
      headers: formData.getHeaders(),
      timeout: TIMEOUT_MS,
      maxContentLength: 10 * 1024 * 1024,
    });

    logger.info(`AI analysis complete: ${response.data.detected_class} (${response.data.confidence})`);
    return {
      detected_class: response.data.detected_class,
      confidence: response.data.confidence,
      bounding_boxes: response.data.bounding_boxes || [],
      timestamp: response.data.timestamp,
    };
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      logger.error('AI service is not running or unreachable');
      throw new Error('AI_SERVICE_UNAVAILABLE');
    }
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
      logger.error('AI service timed out');
      throw new Error('AI_SERVICE_TIMEOUT');
    }
    logger.error(`AI service error: ${err.message}`);
    throw err;
  }
};

exports.checkHealth = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
    return response.data;
  } catch {
    return { status: 'unreachable', model_loaded: false };
  }
};
