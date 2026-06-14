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

// ============ EMAIL VERIFICATION SYSTEM ============

// Store verification codes temporarily
const verificationCodes = new Map();

// Generate random 6-digit code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email service setup
let emailTransporter = null;
let emailDemoMode = true;

// Check if we have real SMTP credentials
const hasRealSMTP = process.env.SMTP_USER && 
                    process.env.SMTP_PASS && 
                    process.env.SMTP_USER !== 'noreply@zwarmis.com' &&
                    process.env.SMTP_PASS !== 'app-password';

if (hasRealSMTP) {
    emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    emailDemoMode = false;
    console.log('📧 Email service configured with SMTP:', process.env.SMTP_USER);
} else {
    console.log('📧 Email service running in DEMO MODE (codes will be logged to console)');
    console.log('💡 To enable real emails, set SMTP_USER and SMTP_PASS in .env file');
}

// Send verification email function
async function sendVerificationEmail(email, code, username) {
    if (emailDemoMode) {
        console.log('\n' + '='.repeat(60));
        console.log('📧 [DEMO MODE] Verification Code Sent');
        console.log('='.repeat(60));
        console.log(`To: ${email}`);
        console.log(`User: ${username}`);
        console.log(`🔐 VERIFICATION CODE: ${code}`);
        console.log(`⏰ Expires in: 10 minutes`);
        console.log('='.repeat(60) + '\n');
        return { success: true, demo: true };
    }

    try {
        const mailOptions = {
            from: `"ZWARMIS" <${process.env.SMTP_USER}>`,
            to: email,
            subject: '🔐 ZWARMIS - Your Verification Code for Data Collection',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 20px; }
                        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 30px; text-align: center; }
                        .header h1 { color: white; margin: 0; font-size: 28px; }
                        .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; }
                        .content { padding: 30px; }
                        .greeting { font-size: 16px; color: #334155; margin-bottom: 20px; }
                        .code-box { background: #f0f9ff; border: 2px solid #2563eb; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0; }
                        .code { font-size: 42px; font-weight: 800; color: #1e3a8a; letter-spacing: 8px; font-family: monospace; }
                        .expiry { color: #64748b; font-size: 12px; margin-top: 12px; }
                        .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
                        .warning { color: #d97706; font-size: 13px; margin-top: 20px; padding: 12px; background: #fffbeb; border-radius: 8px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🌊 ZWARMIS</h1>
                            <p>Zimbabwe Water Resource Monitoring System</p>
                        </div>
                        <div class="content">
                            <div class="greeting">
                                <strong>Hello ${username},</strong>
                                <p style="margin-top: 10px;">You requested access to update dam data in ZWARMIS.</p>
                            </div>
                            <div class="code-box">
                                <div class="code">${code}</div>
                                <div class="expiry">⏰ This code expires in <strong>10 minutes</strong></div>
                            </div>
                            <div class="warning">
                                ⚠️ <strong>Security Notice:</strong> Never share this code with anyone.
                            </div>
                        </div>
                        <div class="footer">
                            <p>© 2026 Zimbabwe Water Resource Monitoring System</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };
        
        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
}

// ============ EMAIL VERIFICATION API ROUTES ============

// Send verification code
app.post('/api/send-verification-code', async (req, res) => {
    const { email, name, company, purpose } = req.body;
    
    console.log(`📨 Verification request for: ${email}`);
    
    if (!email || !name) {
        return res.status(400).json({ success: false, error: 'Email and name are required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email format' });
    }
    
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    
    verificationCodes.set(email, { code, expiresAt, name, company, purpose });
    
    const result = await sendVerificationEmail(email, code, name);
    
    if (result.success) {
        res.json({ 
            success: true, 
            demo: result.demo || false,
            message: result.demo ? 'DEMO MODE: Check server console for code' : 'Verification code sent to your email'
        });
    } else {
        res.status(500).json({ success: false, error: result.error });
    }
});

// Resend verification code
app.post('/api/resend-verification-code', async (req, res) => {
    const { email, name } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
    }
    
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const userName = name || (verificationCodes.get(email)?.name) || 'User';
    
    verificationCodes.set(email, { code, expiresAt, name: userName });
    
    const result = await sendVerificationEmail(email, code, userName);
    
    if (result.success) {
        res.json({ success: true, demo: result.demo || false });
    } else {
        res.status(500).json({ success: false, error: result.error });
    }
});

// Verify code
app.post('/api/verify-code', (req, res) => {
    const { code, email } = req.body;
    
    console.log(`🔐 Verification attempt for: ${email}`);
    
    if (!code || !email) {
        return res.status(400).json({ success: false, error: 'Code and email are required' });
    }
    
    const stored = verificationCodes.get(email);
    
    if (!stored) {
        return res.json({ success: false, error: 'No verification code found. Request a new code.' });
    }
    
    if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(email);
        return res.json({ success: false, error: 'Code has expired. Request a new code.' });
    }
    
    if (stored.code === code) {
        verificationCodes.delete(email);
        console.log(`✅ Code verified for: ${email}`);

        let user = storage.getUserByEmail(email);
        if (!user) {
            user = storage.approveUser(
                stored.name || 'Data Collector',
                email,
                stored.company || 'Unknown',
                stored.purpose || 'Dam data update'
            );
        }

        const sessionId = storage.createSession(user.id, {
            email,
            source: 'data-entry'
        });

        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 60 * 1000
        });

        res.json({
            success: true,
            sessionId,
            username: user.username,
            userId: user.id
        });
    } else {
        console.log(`❌ Invalid code for: ${email}`);
        res.json({ success: false, error: 'Invalid code. Try again.' });
    }
});

// Clean up expired codes every minute
setInterval(() => {
    const now = Date.now();
    let expiredCount = 0;
    for (const [email, data] of verificationCodes.entries()) {
        if (now > data.expiresAt) {
            verificationCodes.delete(email);
            expiredCount++;
        }
    }
    if (expiredCount > 0) {
        console.log(`🧹 Cleaned up ${expiredCount} expired codes`);
    }
}, 60000);

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
app.use('/api/admin', adminRoutes);

// Serve the backend dams-data.json file for the frontend
app.get(['/dams-data.json', '/api/dams-data.json'], (req, res, next) => {
  res.sendFile(path.join(__dirname, 'dams-data.json'), (error) => {
    if (error) next(error);
  });
});

// Serve the frontend from the same local origin as the API
app.use(express.static(path.join(__dirname, '../zwarmis-frontend')));

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
