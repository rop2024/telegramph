# Email Setup Guide

## Gmail OAuth2 Setup (Recommended for Production)

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Enable Gmail API

2. **Configure OAuth Consent Screen**
   - Go to OAuth consent screen
   - Set application type to "Internal" or "External"
   - Add scopes: `.../auth/gmail.send`
   - Add test users (for testing)

3. **Create OAuth 2.0 Credentials**
   - Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
   - Set application type to "Web application"
   - Add authorized redirect URIs:
     - `https://developers.google.com/oauthplayground`

4. **Get Refresh Token**
   - Go to [OAuth2 Playground](https://developers.google.com/oauthplayground)
   - Select Gmail API v1
   - Authorize and get refresh token
   - Set environment variables:

```env
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
GMAIL_USER=your-email@gmail.com