// Email service for sending verification codes
const nodemailer = require('nodemailer');
const config = require('./config');

class EmailService {
  constructor() {
    // Demo mode - logs instead of sending
    this.demoMode = !process.env.SMTP_USER || process.env.SMTP_USER === 'noreply@zwarmis.com';
    this.transporter = null;
    
    if (!this.demoMode) {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: false,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS
        }
      });
    }
  }

  async sendVerificationCode(email, code, username) {
    if (this.demoMode) {
      console.log(`📧 DEMO MODE: Verification code for ${email}: ${code}`);
      return { success: true, demo: true };
    }

    try {
      const mailOptions = {
        from: config.SMTP_USER,
        to: email,
        subject: 'ZWARMIS - Data Collection Access Code',
        html: this.getEmailTemplate(code, username)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${email}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  getEmailTemplate(code, username) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f3f4f6; }
            .container { max-width: 500px; margin: 20px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; color: #1e3a8a; margin-bottom: 20px; }
            .code-box { background: #dbeafe; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; color: #1e3a8a; letter-spacing: 5px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌊 ZWARMIS</h1>
              <p>Zimbabwe Water Resource Monitoring System</p>
            </div>
            
            <p>Hello ${username},</p>
            
            <p>Your verification code for data collection access is:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            
            <div class="footer">
              <p>© 2026 Zimbabwe Water Resource Monitoring System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
