const nodemailer = require('nodemailer');
const MailLog = require('../models/MailLog');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
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
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      console.error('Full error:', error);
      this.isConnected = false;
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
      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      
      // Get preview URL from Ethereal
      const previewUrl = nodemailer.getTestMessageUrl(info);
      
      console.log(`✅ Email sent: ${info.messageId}`);
      console.log(`📊 Preview URL: ${previewUrl}`);

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
      console.error('❌ Email sending failed:', error);

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
    return {
      isConnected: this.isConnected,
      emailUser: process.env.EMAIL_USER,
      maxReceiversPerBatch: process.env.MAX_RECEIVERS_PER_BATCH || 50
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;