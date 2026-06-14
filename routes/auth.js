const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { randomUUID } = require('crypto');
const uuidv4 = randomUUID;
const storage = require('../storage');

// Store verification codes temporarily
const verificationCodes = new Map();

// Generate random 6-digit code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email service setup
let emailTransporter = null;
let emailDemoMode = true;

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
}

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

// API Routes

router.get('/status', (req, res) => {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      return res.json({ authenticated: false });
    }

    const session = storage.getSession(sessionId);
    if (!session) {
      return res.json({ authenticated: false });
    }

    const user = storage.getUser(session.userId);
    if (!user) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      username: user.username,
      userId: user.id,
      role: user.role
    });
});

async function handleRequestAccess(req, res) {
    // Support both API_REFERENCE.md keys and old frontend keys
    const userEmail = req.body.userEmail || req.body.email;
    const username = req.body.username || req.body.name;
    const company = req.body.company;
    const purpose = req.body.purpose;

    console.log(`📨 Verification request for: ${userEmail}`);

    if (!userEmail || !username) {
        return res.status(400).json({ success: false, error: 'Email and username are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    const code = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const requestId = uuidv4();

    verificationCodes.set(userEmail, { code, expiresAt, name: username, company, purpose, requestId, attempts: 0 });

    const result = await sendVerificationEmail(userEmail, code, username);

    if (result.success) {
        res.json({
            success: true,
            message: result.demo ? 'DEMO MODE: Check server console for code' : 'Verification code sent to your email',
            requestId: requestId,
            demo: result.demo || false
        });
    } else {
        res.status(500).json({ success: false, error: result.error });
    }
}

router.post('/request-access', handleRequestAccess);

// Fallback for frontend
// Wait, the frontend might call POST /api/send-verification-code (without /auth)
// If it does, we need to map it in server.js. But let's export it just in case.
router.post('/send-verification-code', handleRequestAccess);

router.post('/resend-verification-code', async (req, res) => {
    const email = req.body.email || req.body.userEmail;
    const name = req.body.name || req.body.username;

    if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const code = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const userName = name || (verificationCodes.get(email)?.name) || 'User';

    verificationCodes.set(email, { code, expiresAt, name: userName, attempts: 0 });

    const result = await sendVerificationEmail(email, code, userName);

    if (result.success) {
        res.json({ success: true, demo: result.demo || false });
    } else {
        res.status(500).json({ success: false, error: result.error });
    }
});

router.post('/verify-code', (req, res) => {
    const { code, requestId, email } = req.body;

    // Support either email or requestId to find the code
    let emailKey = email;
    if (!emailKey && requestId) {
        for (const [key, value] of verificationCodes.entries()) {
            if (value.requestId === requestId) {
                emailKey = key;
                break;
            }
        }
    }

    if (!emailKey) {
        return res.status(400).json({ success: false, error: 'No pending request found.' });
    }

    console.log(`🔐 Verification attempt for: ${emailKey}`);

    if (!code) {
        return res.status(400).json({ success: false, error: 'Code is required' });
    }

    const stored = verificationCodes.get(emailKey);

    if (!stored) {
        return res.json({ success: false, error: 'No verification code found. Request a new code.' });
    }

    if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(emailKey);
        return res.json({ success: false, error: 'Code has expired. Request a new code.' });
    }

    stored.attempts += 1;
    if (stored.attempts > 5) {
        verificationCodes.delete(emailKey);
        return res.status(400).json({ success: false, error: 'Too many failed attempts. Request a new code.' });
    }

    if (stored.code === code) {
        verificationCodes.delete(emailKey);
        console.log(`✅ Code verified for: ${emailKey}`);

        let user = storage.getUserByEmail(emailKey);
        if (!user) {
            user = storage.approveUser(
                stored.name || 'Data Collector',
                emailKey,
                stored.company || 'Unknown',
                stored.purpose || 'Dam data update'
            );
        }

        const sessionId = storage.createSession(user.id, {
            email: emailKey,
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
            message: 'Access granted!',
            username: user.username,
            userId: user.id
        });
    } else {
        console.log(`❌ Invalid code for: ${emailKey}`);
        res.json({ success: false, error: 'Invalid code. Try again.' });
    }
});

router.post('/logout', (req, res) => {
    const sessionId = req.cookies.sessionId;

    if (sessionId) {
      storage.deleteSession(sessionId);
      res.clearCookie('sessionId');
    }

    res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
