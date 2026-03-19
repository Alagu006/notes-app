// config.js
const CONFIG = {
    // For local development
    DEV_API_URL: 'http://localhost:5000/api',
    // For production (update this after deploying backend)
    PROD_API_URL: 'https://your-backend.onrender.com/api'
};

// Auto-detect environment
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? CONFIG.DEV_API_URL
    : CONFIG.PROD_API_URL;