// Environment configuration
require('dotenv').config();

function parseCorsOrigin(value) {
  const origins = value
    ? value.split(',').map(origin => origin.trim()).filter(Boolean)
    : [
        'http://localhost:3000', 
        'http://localhost:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:8081',
        'http://localhost:8080',
        'http://localhost:8081',
        'http://127.0.0.1:5500',
        'http://localhost:5500'
      ];

  return Array.from(new Set(origins));
}

const corsOrigins = parseCorsOrigin(process.env.CORS_ORIGIN);

function isAllowedCorsOrigin(origin) {
  // Browser requests from local files use the literal "null" origin.
  // Requests from curl/server-side tools often do not send an Origin header.
  return !origin || origin === 'null' || corsOrigins.includes(origin);
}

module.exports = {
  PORT: process.env.PORT || 3002,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  SESSION_SECRET: process.env.SESSION_SECRET || 'zwarmis-secret-key-2026',
  
  // Email configuration for sending verification codes
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER || 'noreply@zwarmis.com',
  SMTP_PASS: process.env.SMTP_PASS || 'app-password',
  
  // Verification code settings
  CODE_LENGTH: 6,
  CODE_EXPIRY_MINUTES: 10,
  MAX_CODE_ATTEMPTS: 5,
  
  // CORS settings
  CORS_ORIGIN: corsOrigins,
  isAllowedCorsOrigin,
};