const express = require('express');
const { google } = require('googleapis');

const router = express.Router();

// Read Google OAuth settings from environment
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
} = process.env;

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Request send and compose scopes (plus basic profile scopes) so we can send mail and create drafts
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'email',
  'profile',
  'openid'
];

// Step 1: Generate consent URL
router.get('/url', (req, res) => {
  try {
    const url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });

    res.status(200).json({ success: true, url });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ success: false, message: 'Failed to generate auth URL' });
  }
});

// Step 2: Callback to exchange code for tokens
router.get('/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Missing code parameter' });
    }

    const { tokens } = await oAuth2Client.getToken(code);
    // Tokens may include access_token, refresh_token (only on first consent), expiry_date

    // IMPORTANT: tokens.refresh_token is returned only the first time the user consents.
    // Persist tokens.refresh_token securely (copy to .env for production) if present.

    res.status(200).json({ success: true, tokens });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({ success: false, message: 'Failed to exchange code for tokens', error: error.message });
  }
});

module.exports = router;
