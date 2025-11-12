const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const MailLog = require('../models/MailLog');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConnected = false;
    this.lastError = null;
    // expose a promise that resolves when initialization finishes
    this.ready = this.init();
  }

  async init() {
    try {
      // Decide between Ethereal/smtp auth and Gmail OAuth2
      const useGmailOauth = String(process.env.USE_GMAIL_OAUTH || '').toLowerCase() === 'true';

      if (useGmailOauth) {
        console.log('📧 Initializing Gmail OAuth2 transporter...');

        const {
          GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET,
          GOOGLE_REFRESH_TOKEN,
          GMAIL_FROM_ADDRESS
        } = process.env;

        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
          throw new Error('Gmail OAuth configured but GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN is missing');
        }

        console.log('🔑 Using Gmail account:', GMAIL_FROM_ADDRESS || process.env.EMAIL_USER);
        console.log('🔐 Obtaining access token from refresh token...');

        const oauth2Client = new google.auth.OAuth2(
          GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

        // googleapis getAccessToken returns a Promise-like object
        const accessTokenResponse = await oauth2Client.getAccessToken();
        const accessToken = accessTokenResponse && accessTokenResponse.token ? accessTokenResponse.token : accessTokenResponse;

        if (!accessToken) {
          throw new Error('Failed to obtain access token via refresh token');
        }

        console.log('✅ Access token obtained successfully');

        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: GMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            refreshToken: GOOGLE_REFRESH_TOKEN,
            accessToken: accessToken
          },
          logger: false,
          debug: false
        });

        console.log('🔌 Verifying Gmail SMTP connection...');
        try {
          await this.transporter.verify();
          console.log('✅ Gmail OAuth2 transporter ready - email service is operational');
        } catch (verifyError) {
          console.log('⚠️  SMTP verification failed (this is common with Gmail OAuth)');
          console.log('   Gmail API (for drafts) will still work correctly');
          console.log('   SMTP sending may have issues - use Gmail API methods instead');
        }
        
        this.isConnected = true;
        console.log('✅ Gmail OAuth2 service initialized - draft creation available');
      } else {
        // Create Ethereal test account if no credentials provided
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
          console.log('📧 Creating Ethereal test account...');
          const testAccount = await nodemailer.createTestAccount();
          
          process.env.EMAIL_USER = testAccount.user;
          process.env.EMAIL_PASS = testAccount.pass;
          
          console.log('✅ Ethereal account created:', testAccount.user);
          console.log('🔑 Password:', testAccount.pass);
        }

        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
          port: parseInt(process.env.EMAIL_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          // Add better error handling
          logger: process.env.NODE_ENV === 'development',
          debug: process.env.NODE_ENV === 'development',
        });

        // Verify connection
        await this.transporter.verify();
        this.isConnected = true;
        console.log('✅ Email transporter is ready');
      }
    } catch (error) {
      this.lastError = error;
      console.error('❌ Gmail OAuth2 initialization failed:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        console.error('📋 Error details:', error.stack);
        console.log('⚠️  Check your Google OAuth credentials in .env:');
        console.log('   - GOOGLE_CLIENT_ID');
        console.log('   - GOOGLE_CLIENT_SECRET');
        console.log('   - GOOGLE_REFRESH_TOKEN');
        console.log('   - GMAIL_FROM_ADDRESS');
        console.log('');
        console.log('💡 To obtain a valid refresh token with compose scope:');
        console.log('   1. Visit: http://localhost:5000/api/auth/google/url');
        console.log('   2. Follow the consent URL and sign in');
        console.log('   3. Copy the refresh_token from the callback response');
        console.log('   4. Update GOOGLE_REFRESH_TOKEN in .env');
        console.log('');
      }
      
      this.isConnected = false;
      // Do not fall back to Ethereal - fail clearly if Gmail OAuth is configured but broken
    }
  }

  /**
   * Send single email
   */
  async sendEmail(mailOptions, mailLogId) {
    if (!this.isConnected || !this.transporter) {
      throw new Error('Email service is not initialized');
    }

    try {
      console.log(`📤 Sending email to: ${mailOptions.to}`);
      
      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      
      // Get preview URL from Ethereal (only for non-Gmail providers)
      const previewUrl = nodemailer.getTestMessageUrl(info);
      
      console.log(`✅ Email sent successfully`);
      console.log(`   Message ID: ${info.messageId}`);
      if (previewUrl) {
        console.log(`   Preview URL: ${previewUrl}`);
      }

      // Update mail log
      if (mailLogId) {
        await MailLog.findByIdAndUpdate(mailLogId, {
          status: 'sent',
          messageId: info.messageId,
          previewUrl: previewUrl,
          providerMessageId: info.messageId,
          sentAt: new Date()
        });
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl,
        response: info.response
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);

      // Update mail log with error
      if (mailLogId) {
        await MailLog.findByIdAndUpdate(mailLogId, {
          status: 'failed',
          errorMessage: error.message
        });
      }

      throw error;
    }
  }

  /**
   * Send bulk emails with rate limiting
   */
  async sendBulkEmails(emails, batchDelay = 1000) {
    if (!this.isConnected) {
      throw new Error('Email service is not initialized');
    }

    const results = {
      successful: 0,
      failed: 0,
      total: emails.length,
      details: []
    };

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      
      try {
        const result = await this.sendEmail(email.mailOptions, email.mailLogId);
        results.successful++;
        results.details.push({
          email: email.mailOptions.to,
          status: 'success',
          messageId: result.messageId,
          previewUrl: result.previewUrl
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          email: email.mailOptions.to,
          status: 'failed',
          error: error.message
        });
      }

      // Add delay between emails to avoid rate limiting
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }

    return results;
  }

  /**
   * Generate tracking pixel HTML
   */
  generateTrackingPixel(trackingId) {
    const trackingUrl = `${process.env.CLIENT_URL || 'http://localhost:5000'}/api/mail/track/${trackingId}/pixel.gif`;
    return `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none" />`;
  }

  /**
   * Generate tracked link
   */
  generateTrackedLink(originalUrl, trackingId, linkId) {
    const trackedUrl = `${process.env.CLIENT_URL || 'http://localhost:5000'}/api/mail/track/${trackingId}/click`;
    return `${trackedUrl}?url=${encodeURIComponent(originalUrl)}&link=${linkId}`;
  }

  /**
   * Process email body with tracking
   */
  processBodyWithTracking(body, trackingId) {
    if (!trackingId) return body;

    let processedBody = body;

    // Add tracking pixel at the end
    const trackingPixel = this.generateTrackingPixel(trackingId);
    if (!processedBody.includes('</body>')) {
      processedBody += trackingPixel;
    } else {
      processedBody = processedBody.replace('</body>', `${trackingPixel}</body>`);
    }

    // Convert links to tracked links (simple version)
    // In a real implementation, you'd want a more sophisticated HTML parser
    const linkRegex = /<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
    let linkIndex = 0;
    
    processedBody = processedBody.replace(linkRegex, (match, url, text) => {
      if (url.startsWith('http')) {
        const trackedUrl = this.generateTrackedLink(url, trackingId, `link${linkIndex++}`);
        return match.replace(`href="${url}"`, `href="${trackedUrl}"`);
      }
      return match;
    });

    return processedBody;
  }

  /**
   * Get email service status
   */
  getStatus() {
    const provider = String(process.env.USE_GMAIL_OAUTH || '').toLowerCase() === 'true' ? 'gmail-oauth2' : (process.env.EMAIL_HOST || 'smtp');

    const status = {
      isConnected: this.isConnected,
      provider,
      // When using Gmail OAuth prefer the gmail address as the sending user
      emailUser: provider === 'gmail-oauth2' ? (process.env.GMAIL_FROM_ADDRESS || process.env.EMAIL_USER) : (process.env.EMAIL_USER || process.env.GMAIL_FROM_ADDRESS),
      maxReceiversPerBatch: process.env.MAX_RECEIVERS_PER_BATCH || 50
    };

    if (process.env.NODE_ENV === 'development' && this.lastError) {
      status.lastError = this.lastError.message || String(this.lastError);
    }

    return status;
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;