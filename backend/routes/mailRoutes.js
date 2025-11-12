const express = require('express');
const { protect } = require('../middleware/auth');
const Draft = require('../models/Draft');
const Receiver = require('../models/Receiver');
const MailLog = require('../models/MailLog');
const emailService = require('../utils/emailService');
const { google } = require('googleapis');
const { decryptAES } = require('../utils/crypto');

const router = express.Router();

// Helper function to send email via Gmail API
async function sendViaGmailAPI(mailOptions) {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    GMAIL_FROM_ADDRESS
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Gmail OAuth not configured');
  }

  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );

  oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  // Build MIME message
  let rawMessage = '';
  rawMessage += `From: ${mailOptions.from || GMAIL_FROM_ADDRESS}\r\n`;
  rawMessage += `To: ${mailOptions.to}\r\n`;
  if (mailOptions.cc) rawMessage += `Cc: ${Array.isArray(mailOptions.cc) ? mailOptions.cc.join(', ') : mailOptions.cc}\r\n`;
  if (mailOptions.bcc) rawMessage += `Bcc: ${Array.isArray(mailOptions.bcc) ? mailOptions.bcc.join(', ') : mailOptions.bcc}\r\n`;
  rawMessage += `Subject: ${mailOptions.subject}\r\n`;
  
  // Add custom headers if present
  if (mailOptions.headers) {
    Object.keys(mailOptions.headers).forEach(key => {
      rawMessage += `${key}: ${mailOptions.headers[key]}\r\n`;
    });
  }
  
  rawMessage += 'MIME-Version: 1.0\r\n';
  rawMessage += 'Content-Type: text/html; charset=UTF-8\r\n';
  rawMessage += '\r\n';
  rawMessage += mailOptions.html || mailOptions.text || '';

  // Gmail API expects base64url encoded string
  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const sendRes = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  });

  return {
    messageId: `<${sendRes.data.id}@gmail.com>`,
    gmailMessageId: sendRes.data.id,
    threadId: sendRes.data.threadId
  };
}

// Handler for sending a test email (shared between dev/public and protected versions)
const sendTestHandler = async (req, res) => {
  // Wait briefly for emailService to finish initialization (useful in dev/test flows)
  try {
    const maxWait = 5000; // ms
    const pollInterval = 250; // ms
    const start = Date.now();
    while (!emailService.isConnected && Date.now() - start < maxWait) {
      await new Promise(r => setTimeout(r, pollInterval));
    }
  } catch (e) {
    // ignore
  }
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recipient email, subject, and body'
      });
    }

    // Use Gmail address if Gmail OAuth is enabled, otherwise use EMAIL_USER
    const fromEmail = process.env.GMAIL_FROM_ADDRESS || process.env.EMAIL_USER;
    
    const mailOptions = {
      from: `"Telegraph" <${fromEmail}>`,
      to: to,
      subject: subject,
      text: body.replace(/<[^>]*>/g, ''), // Plain text version
      html: body // HTML version
    };

    const result = await emailService.sendEmail(mailOptions);

    // Return messageId explicitly so callers (and Gmail OAuth users) can see the provider message id
    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result && result.messageId,
      previewUrl: result && result.previewUrl,
      data: result
    });
  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Register send-test route: always protected (requires JWT)
// Returns messageId from the provider (for Gmail OAuth this will be the Gmail message id).
router.post('/send-test', protect, async (req, res) => sendTestHandler(req, res));

// @desc    Send email to single receiver
// @route   POST /api/mail/send
// @access  Private
router.post('/send', protect, async (req, res) => {
  try {
    const { draftId, receiverId } = req.body;

    if (!draftId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide draft ID and receiver ID'
      });
    }

    // Get draft and verify ownership
    const draft = await Draft.findOne({
      _id: draftId,
      user: req.user.id
    }).populate('receivers', 'name email company');

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Get receiver and verify ownership
    const receiver = await Receiver.findOne({
      _id: receiverId,
      user: req.user.id
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Decrypt receiver email using the virtual property
    let decryptedEmail;
    try {
      decryptedEmail = receiver.decryptedEmail;
      if (!decryptedEmail || typeof decryptedEmail !== 'string') {
        throw new Error('Email decryption returned invalid value');
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(decryptedEmail)) {
        throw new Error('Decrypted email has invalid format');
      }
    } catch (error) {
      console.error('❌ Failed to decrypt receiver email:', error.message);
      console.error('   Receiver ID:', receiverId);
      console.error('   Encrypted email:', receiver.email);
      return res.status(500).json({
        success: false,
        message: 'Failed to decrypt receiver email',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    console.log('📧 Preparing to send email...');
    console.log('   Draft:', draft.title || draft._id);
    console.log('   To:', receiver.name, '<' + decryptedEmail + '>');
    console.log('   Subject:', draft.subject);

    // Create mail log entry
    const mailLog = await MailLog.create({
      user: req.user.id,
      draft: draftId,
      receiver: receiverId,
      receiverEmail: decryptedEmail,
      receiverName: receiver.name,
      subject: draft.subject,
      body: draft.body,
      status: 'pending',
      metadata: {
        campaignId: `campaign-${draftId}-${Date.now()}`,
        draftTitle: draft.title
      }
    });

    // Process body with tracking
    const processedBody = emailService.processBodyWithTracking(
      draft.body, 
      mailLog.trackingId
    );

    // Use Gmail address if Gmail OAuth is enabled, otherwise use EMAIL_USER
    const fromEmail = process.env.GMAIL_FROM_ADDRESS || process.env.EMAIL_USER;
    const fromName = req.user.name || 'Telegraph';

    // Prepare email
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: `"${receiver.name}" <${decryptedEmail}>`,
      subject: draft.subject,
      text: processedBody.replace(/<[^>]*>/g, ''), // Plain text version
      html: processedBody, // HTML version with tracking
      headers: {
        'X-Tracking-ID': mailLog.trackingId,
        'X-Campaign-ID': mailLog.metadata.get('campaignId')
      }
    };

    // Add CC if present
    if (draft.cc && draft.cc.length > 0) {
      mailOptions.cc = draft.cc.join(', ');
    }

    // Add BCC if present
    if (draft.bcc && draft.bcc.length > 0) {
      mailOptions.bcc = draft.bcc.join(', ');
    }

    // Send email - Use Gmail API if configured, otherwise fallback to SMTP
    let result;
    const useGmailAPI = String(process.env.USE_GMAIL_OAUTH || '').toLowerCase() === 'true';
    
    try {
      if (useGmailAPI) {
        console.log('📤 Sending via Gmail API...');
        result = await sendViaGmailAPI(mailOptions);
        
        // Update mail log with Gmail API response
        await MailLog.findByIdAndUpdate(mailLog._id, {
          status: 'sent',
          messageId: result.messageId,
          providerMessageId: result.gmailMessageId,
          emailProvider: 'gmail-api',
          sentAt: new Date()
        });
        
        console.log('✅ Email sent successfully via Gmail API');
        console.log('   Message ID:', result.gmailMessageId);
        console.log('   Thread ID:', result.threadId);
      } else {
        console.log('📤 Sending via SMTP...');
        result = await emailService.sendEmail(mailOptions, mailLog._id);
        console.log('✅ Email sent successfully via SMTP');
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      await MailLog.findByIdAndUpdate(mailLog._id, {
        status: 'failed',
        errorMessage: error.message
      });
      throw error;
    }

    // Update draft status if this is the first email being sent
    if (draft.status === 'draft') {
      await Draft.findByIdAndUpdate(draftId, { status: 'sent' });
    }

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: {
        mailLog: mailLog._id,
        trackingId: mailLog.trackingId,
        messageId: result.messageId || result.gmailMessageId,
        provider: useGmailAPI ? 'gmail-api' : 'smtp'
      }
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Create a Gmail draft (saved in the sender's Drafts folder)
// @route   POST /api/mail/create-draft-gmail
// @access  Private
router.post('/create-draft-gmail', protect, async (req, res) => {
  try {
    const { to, subject, body, cc, bcc } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recipient (to), subject and body for the draft'
      });
    }

    const {
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REFRESH_TOKEN,
      GMAIL_FROM_ADDRESS
    } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured on the server (missing env vars)'
      });
    }

    console.log('📝 Creating Gmail draft...');
    console.log(`   From: ${GMAIL_FROM_ADDRESS || process.env.EMAIL_USER}`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);

    const oAuth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );

    oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Build a simple HTML MIME message. For more complex needs build multipart/alternative.
    let rawMessage = '';
    rawMessage += `From: ${GMAIL_FROM_ADDRESS || process.env.EMAIL_USER}\r\n`;
    rawMessage += `To: ${to}\r\n`;
    if (cc) rawMessage += `Cc: ${Array.isArray(cc) ? cc.join(', ') : cc}\r\n`;
    if (bcc) rawMessage += `Bcc: ${Array.isArray(bcc) ? bcc.join(', ') : bcc}\r\n`;
    rawMessage += `Subject: ${subject}\r\n`;
    rawMessage += 'MIME-Version: 1.0\r\n';
    rawMessage += 'Content-Type: text/html; charset=UTF-8\r\n';
    rawMessage += '\r\n';
    rawMessage += body;

    // Gmail API expects base64url encoded string (no padding, +/ replaced)
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('🔐 Calling Gmail API to create draft...');
    const createRes = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage
        }
      }
    });

    const draftId = createRes && createRes.data && createRes.data.id;
    const messageId = createRes && createRes.data && createRes.data.message && createRes.data.message.id;

    console.log('✅ Gmail draft created successfully');
    console.log(`   Draft ID: ${draftId}`);
    console.log(`   Message ID: ${messageId}`);
    console.log('   📥 Check Gmail Drafts folder to see the draft');

    res.status(200).json({
      success: true,
      message: 'Gmail draft created',
      draftId,
      messageId,
      data: createRes.data
    });
  } catch (error) {
    console.error('❌ Create Gmail draft error:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('📋 Error details:', error);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create Gmail draft',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Send email directly via Gmail API
// @route   POST /api/mail/send-gmail
// @access  Private
router.post('/send-gmail', protect, async (req, res) => {
  try {
    const { to, subject, body, cc, bcc } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recipient (to) and subject'
      });
    }

    const {
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REFRESH_TOKEN,
      GMAIL_FROM_ADDRESS
    } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured on the server (missing env vars)'
      });
    }

    console.log('📤 Sending email via Gmail API...');
    console.log(`   From: ${GMAIL_FROM_ADDRESS || process.env.EMAIL_USER}`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);

    const oAuth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );

    oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Build MIME message
    let rawMessage = '';
    rawMessage += `From: ${GMAIL_FROM_ADDRESS || process.env.EMAIL_USER}\r\n`;
    rawMessage += `To: ${to}\r\n`;
    if (cc) rawMessage += `Cc: ${Array.isArray(cc) ? cc.join(', ') : cc}\r\n`;
    if (bcc) rawMessage += `Bcc: ${Array.isArray(bcc) ? bcc.join(', ') : bcc}\r\n`;
    rawMessage += `Subject: ${subject}\r\n`;
    rawMessage += 'MIME-Version: 1.0\r\n';
    rawMessage += 'Content-Type: text/html; charset=UTF-8\r\n';
    rawMessage += '\r\n';
    rawMessage += body || '';

    // Gmail API expects base64url encoded string
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('🔐 Calling Gmail API to send message...');
    const sendRes = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    const messageId = sendRes && sendRes.data && sendRes.data.id;
    const threadId = sendRes && sendRes.data && sendRes.data.threadId;

    console.log('✅ Email sent successfully via Gmail API');
    console.log(`   Message ID: ${messageId}`);
    console.log(`   Thread ID: ${threadId}`);

    res.status(200).json({
      success: true,
      message: 'Email sent via Gmail',
      id: messageId,
      messageId,
      threadId,
      data: sendRes.data
    });
  } catch (error) {
    console.error('❌ Send Gmail error:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('📋 Error details:', error);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to send email via Gmail',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Send bulk emails
// @route   POST /api/mail/send-bulk
// @access  Private
router.post('/send-bulk', protect, async (req, res) => {
  try {
    const { draftId, receiverIds, batchDelay = 1000 } = req.body;

    if (!draftId || !receiverIds || !Array.isArray(receiverIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide draft ID and an array of receiver IDs'
      });
    }

    // Limit batch size
    const maxBatchSize = process.env.MAX_RECEIVERS_PER_BATCH || 50;
    const limitedReceiverIds = receiverIds.slice(0, maxBatchSize);

    // Get draft and verify ownership
    const draft = await Draft.findOne({
      _id: draftId,
      user: req.user.id
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Get receivers and verify ownership
    const receivers = await Receiver.find({
      _id: { $in: limitedReceiverIds },
      user: req.user.id
    });

    if (receivers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid receivers found'
      });
    }

    // Create mail log entries and prepare emails
    const emails = [];
    const mailLogs = [];

    // Use Gmail address if Gmail OAuth is enabled, otherwise use EMAIL_USER
    const fromEmail = process.env.GMAIL_FROM_ADDRESS || process.env.EMAIL_USER;
    const fromName = req.user.name || 'Telegraph';

    console.log(`📧 Preparing to send bulk email to ${receivers.length} receivers...`);
    console.log('   Draft:', draft.title || draft._id);
    console.log('   Subject:', draft.subject);

    for (const receiver of receivers) {
      // Decrypt receiver email using the virtual property
      let decryptedEmail;
      try {
        decryptedEmail = receiver.decryptedEmail;
        if (!decryptedEmail || typeof decryptedEmail !== 'string') {
          throw new Error('Email decryption returned invalid value');
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(decryptedEmail)) {
          throw new Error('Decrypted email has invalid format');
        }
      } catch (error) {
        console.warn(`⚠️  Skipping receiver ${receiver._id}: ${error.message}`);
        console.warn(`   Receiver name: ${receiver.name}`);
        console.warn(`   Encrypted email: ${receiver.email}`);
        continue;
      }

      console.log(`   → ${receiver.name} <${decryptedEmail}>`);

      // Create mail log entry
      const mailLog = new MailLog({
        user: req.user.id,
        draft: draftId,
        receiver: receiver._id,
        receiverEmail: decryptedEmail,
        receiverName: receiver.name,
        subject: draft.subject,
        body: draft.body,
        status: 'pending',
        metadata: {
          campaignId: `bulk-${draftId}-${Date.now()}`,
          draftTitle: draft.title,
          batchIndex: emails.length
        }
      });

      await mailLog.save();
      mailLogs.push(mailLog);

      // Process body with tracking
      const processedBody = emailService.processBodyWithTracking(
        draft.body, 
        mailLog.trackingId
      );

      // Prepare email
      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: `"${receiver.name}" <${decryptedEmail}>`,
        subject: draft.subject,
        text: processedBody.replace(/<[^>]*>/g, ''),
        html: processedBody,
        headers: {
          'X-Tracking-ID': mailLog.trackingId,
          'X-Campaign-ID': mailLog.metadata.get('campaignId')
        }
      };

      // Add CC if present
      if (draft.cc && draft.cc.length > 0) {
        mailOptions.cc = draft.cc.join(', ');
      }

      // Add BCC if present
      if (draft.bcc && draft.bcc.length > 0) {
        mailOptions.bcc = draft.bcc.join(', ');
      }

      emails.push({
        mailOptions,
        mailLogId: mailLog._id
      });
    }

    // Validate that we have at least one email to send
    if (emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid receiver emails found. All receivers failed email decryption.'
      });
    }

    console.log(`✅ ${emails.length} emails prepared, starting send process...`);

    // Send bulk emails - Use Gmail API if configured, otherwise fallback to SMTP
    const useGmailAPI = String(process.env.USE_GMAIL_OAUTH || '').toLowerCase() === 'true';
    let results;

    if (useGmailAPI) {
      console.log('📤 Sending bulk emails via Gmail API...');
      results = {
        successful: 0,
        failed: 0,
        total: emails.length,
        details: []
      };

      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        
        try {
          const result = await sendViaGmailAPI(email.mailOptions);
          
          // Update mail log
          await MailLog.findByIdAndUpdate(email.mailLogId, {
            status: 'sent',
            messageId: result.messageId,
            providerMessageId: result.gmailMessageId,
            emailProvider: 'gmail-api',
            sentAt: new Date()
          });

          results.successful++;
          results.details.push({
            email: email.mailOptions.to,
            status: 'success',
            messageId: result.gmailMessageId
          });
          
          console.log(`   ✅ Sent ${i + 1}/${emails.length}: ${email.mailOptions.to}`);
        } catch (error) {
          // Update mail log with error
          await MailLog.findByIdAndUpdate(email.mailLogId, {
            status: 'failed',
            errorMessage: error.message
          });

          results.failed++;
          results.details.push({
            email: email.mailOptions.to,
            status: 'failed',
            error: error.message
          });
          
          console.error(`   ❌ Failed ${i + 1}/${emails.length}: ${email.mailOptions.to} - ${error.message}`);
        }

        // Add delay between emails to avoid rate limiting
        if (i < emails.length - 1) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      }
    } else {
      console.log('📤 Sending bulk emails via SMTP...');
      results = await emailService.sendBulkEmails(emails, batchDelay);
    }

    // Update draft status
    await Draft.findByIdAndUpdate(draftId, { status: 'sent' });

    res.status(200).json({
      success: true,
      message: `Bulk email sending completed. ${results.successful} sent, ${results.failed} failed.`,
      data: {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        campaignId: `bulk-${draftId}-${Date.now()}`,
        details: results.details
      }
    });
  } catch (error) {
    console.error('Send bulk email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk emails',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Track email opens (pixel tracking)
// @route   GET /api/mail/track/:trackingId/pixel.gif
// @access  Public
router.get('/track/:trackingId/pixel.gif', async (req, res) => {
  try {
    const { trackingId } = req.params;

    const mailLog = await MailLog.findOne({ trackingId });
    
    if (mailLog) {
      // Record the open
      await mailLog.recordOpen();
      
      console.log(`📨 Email opened: ${mailLog.receiverEmail} (${trackingId})`);
    }

    // Return a 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.end(pixel);
  } catch (error) {
    console.error('Pixel tracking error:', error);
    // Still return the pixel even if tracking fails
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.type('gif').send(pixel);
  }
});

// @desc    Track link clicks
// @route   GET /api/mail/track/:trackingId/click
// @access  Public
router.get('/track/:trackingId/click', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { url, link } = req.query;

    if (!url) {
      return res.status(400).send('Missing URL parameter');
    }

    const mailLog = await MailLog.findOne({ trackingId });
    
    if (mailLog) {
      // Record the click
      await mailLog.recordClick();
      
      console.log(`🔗 Link clicked: ${mailLog.receiverEmail} -> ${url} (${trackingId})`);
    }

    // Redirect to the original URL
    res.redirect(url);
  } catch (error) {
    console.error('Click tracking error:', error);
    // Still redirect even if tracking fails
    if (req.query.url) {
      res.redirect(req.query.url);
    } else {
      res.status(400).send('Invalid tracking request');
    }
  }
});

// @desc    Get email logs
// @route   GET /api/mail/logs
// @access  Private
router.get('/logs', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      draftId,
      receiverEmail,
      startDate,
      endDate,
      sortBy = 'sentAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query = { user: req.user.id };
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by draft
    if (draftId) {
      query.draft = draftId;
    }

    // Filter by receiver email
    if (receiverEmail) {
      query.receiverEmail = { $regex: receiverEmail, $options: 'i' };
    }

    // Filter by date range
    if (startDate || endDate) {
      query.sentAt = {};
      if (startDate) query.sentAt.$gte = new Date(startDate);
      if (endDate) query.sentAt.$lte = new Date(endDate);
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const logs = await MailLog.find(query)
      .populate('draft', 'title subject')
      .populate('receiver', 'name company')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await MailLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs ? logs.length : 0,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: logs || []
    });
  } catch (error) {
    console.error('Get mail logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving mail logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get email analytics
// @route   GET /api/mail/analytics
// @access  Private
router.get('/analytics', protect, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get sending statistics
    const stats = await MailLog.getSendingStats(req.user.id, startDate, endDate);
    
    // Format stats
    const formattedStats = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
      totalOpens: 0,
      totalClicks: 0
    };

    if (stats && Array.isArray(stats)) {
      stats.forEach(stat => {
        formattedStats[stat._id] = stat.count;
        formattedStats.totalOpens += stat.totalOpens || 0;
        formattedStats.totalClicks += stat.totalClicks || 0;
      });
    }

    // Calculate rates
    const totalSent = formattedStats.sent + formattedStats.delivered + formattedStats.opened + formattedStats.clicked;
    formattedStats.deliveryRate = totalSent > 0 ? (formattedStats.delivered / totalSent * 100).toFixed(2) : 0;
    formattedStats.openRate = totalSent > 0 ? (formattedStats.opened / totalSent * 100).toFixed(2) : 0;
    formattedStats.clickRate = totalSent > 0 ? (formattedStats.clicked / totalSent * 100).toFixed(2) : 0;
    formattedStats.clickToOpenRate = formattedStats.opened > 0 ? (formattedStats.clicked / formattedStats.opened * 100).toFixed(2) : 0;

    // Get recent activity
    const recentActivity = await MailLog.find({
      user: req.user.id,
      sentAt: { $exists: true, $gte: startDate }
    })
    .populate('draft', 'title')
    .populate('receiver', 'name')
    .sort({ sentAt: -1 })
    .limit(10)
    .lean();

    res.status(200).json({
      success: true,
      data: {
        period: {
          start: startDate,
          end: endDate
        },
        statistics: formattedStats,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get email service status
// @route   GET /api/mail/status
// @access  Public (read-only; returns limited debug info)
router.get('/status', async (req, res) => {
  try {
    const status = emailService.getStatus();
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get email status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving email service status'
    });
  }
});

// @desc    Retry failed email
// @route   POST /api/mail/retry/:mailLogId
// @access  Private
router.post('/retry/:mailLogId', protect, async (req, res) => {
  try {
    const mailLog = await MailLog.findOne({
      _id: req.params.mailLogId,
      user: req.user.id,
      status: 'failed'
    }).populate('draft').populate('receiver');

    if (!mailLog) {
      return res.status(404).json({
        success: false,
        message: 'Failed mail log entry not found'
      });
    }

    // Use Gmail address if Gmail OAuth is enabled, otherwise use EMAIL_USER
    const fromEmail = process.env.GMAIL_FROM_ADDRESS || process.env.EMAIL_USER;
    const fromName = req.user.name || 'Telegraph';

    // Process body with tracking
    const processedBody = emailService.processBodyWithTracking(
      mailLog.body, 
      mailLog.trackingId
    );

    // Prepare email
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: `"${mailLog.receiverName}" <${mailLog.receiverEmail}>`,
      subject: mailLog.subject,
      text: processedBody.replace(/<[^>]*>/g, ''),
      html: processedBody,
      headers: {
        'X-Tracking-ID': mailLog.trackingId,
        'X-Retry': 'true'
      }
    };

    // Send email
    const result = await emailService.sendEmail(mailOptions, mailLog._id);

    res.status(200).json({
      success: true,
      message: 'Email retry sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Retry email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrying email'
    });
  }
});

module.exports = router;