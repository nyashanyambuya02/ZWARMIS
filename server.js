// Main server file
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const config = require('./config');
const storage = require('./storage');

// Route imports
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();

// ============ MIDDLEWARE ============

// CORS configuration
app.use(cors({
  origin(origin, callback) {
    if (config.isAllowedCorsOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id']
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============ DATA INITIALIZATION ============
async function loadDamData() {
  try {
    // Load dam data from JSON
    const dataPath = path.join(__dirname, 'dams-data.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      if (data.dams && Array.isArray(data.dams)) {
        console.log(`Loaded ${data.dams.length} dams from JSON file`);
        storage.setDams(data.dams);
        return;
      }
    }

    // Fallback to default data
    console.log('⚠️  No dams found, using default data');
    const defaultDams = [
      {
        id: "kariba",
        name: "Kariba Dam",
        capacity_percent: 78.5,
        province: "Mashonaland West",
        type: "Hydroelectric",
        latitude: -16.521,
        longitude: 28.762,
        image_url: "https://via.placeholder.com/400x300/2ecc71/ffffff?text=Kariba+Dam",
        status: "normal"
      },
      {
        id: "mutirikwi",
        name: "Mutirikwi Dam",
        capacity_percent: 45.2,
        province: "Masvingo",
        type: "Irrigation",
        latitude: -20.243,
        longitude: 30.932,
        image_url: "https://via.placeholder.com/400x300/f39c12/ffffff?text=Mutirikwi+Dam",
        last_updated: "2026-03-25",
        status: "caution"
      },
      {
        id: "manyame",
        name: "Manyame Dam",
        capacity_percent: 92.3,
        province: "Harare",
        type: "Water Supply",
        latitude: -17.133,
        longitude: 30.867,
        image_url: "https://via.placeholder.com/400x300/2ecc71/ffffff?text=Manyame+Dam",
        last_updated: "2026-03-25",
        status: "normal"
      },
      {
        id: "chivero",
        name: "Chivero Dam",
        capacity_percent: 67.8,
        province: "Mashonaland East",
        type: "Recreation",
        latitude: -17.917,
        longitude: 30.817,
        image_url: "https://via.placeholder.com/400x300/f39c12/ffffff?text=Chivero+Dam",
        last_updated: "2026-03-25",
        status: "caution"
      }
    ];
    storage.setDams(defaultDams);
  } catch (error) {
    console.error('Failed to load dam data:', error);
    throw error;
  }
}

// ============ ROUTES ============

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);

// Serve the backend dams-data.json file for the frontend
app.get(['/dams-data.json', '/api/dams-data.json'], (req, res, next) => {
  res.sendFile(path.join(__dirname, 'dams-data.json'), (error) => {
    if (error) next(error);
  });
});

// Serve the frontend from the same local origin as the API
app.use(express.static(path.join(__dirname, 'zwarmis-frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'zwarmis-frontend', 'index.html'));
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// ============ START SERVER ============
async function startServer() {
  try {
    await loadDamData();

    const server = app.listen(config.PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🌊 ZWARMIS Backend Server');
      console.log('='.repeat(60));
      console.log(`✅ Server running on http://localhost:${config.PORT}`);
      console.log(`🌐 CORS enabled for:`, config.CORS_ORIGIN);
      console.log(`📊 ${storage.getDams().length} dams loaded`);
      console.log('='.repeat(60) + '\n');

      setInterval(() => {
        storage.cleanupExpiredData();
      }, 60000);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.PORT} is already in use.`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
