# How to Obtain a New Gmail Refresh Token with Compose Scope

The `/api/mail/create-draft-gmail` endpoint requires a refresh token that includes the `gmail.compose` scope. Follow these steps to obtain a new refresh token:

## Step 1: Start the backend server

```powershell
cd 'D:\@Development\_1_projects\@project - telegraph\backend'
node server.js
```

## Step 2: Get the Google OAuth consent URL

Open a browser or use curl to visit:

```
http://localhost:5000/api/auth/google/url
```

The response will be JSON like:

```json
{
  "success": true,
  "url": "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=..."
}
```

Copy the `url` value.

## Step 3: Open the consent URL in a browser

Paste the URL into your browser. You will be prompted to:
- Sign in with the Gmail account you want to use (the same account as `GMAIL_FROM_ADDRESS` in `.env`)
- Grant permissions to the app for:
  - Send email on your behalf
  - Compose email drafts
  - View your email address
  - View your basic profile info

Click **Allow** / **Continue**.

## Step 4: Copy the code from the callback URL

After consent, Google redirects to:

```
http://localhost:5000/api/auth/google/callback?code=<AUTHORIZATION_CODE>
```

The server will respond with JSON containing the tokens:

```json
{
  "success": true,
  "tokens": {
    "access_token": "ya29.a0...",
    "refresh_token": "1//0gxxx...",
    "scope": "openid https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send ...",
    "token_type": "Bearer",
    "id_token": "eyJhbGciOiJS...",
    "expiry_date": 1762969999999
  }
}
```

**IMPORTANT:** Copy the `refresh_token` value. It will only be returned on the first consent (or when using `prompt=consent`).

## Step 5: Update your .env file

Open `backend/.env` and replace the old `GOOGLE_REFRESH_TOKEN` with the new one:

```env
GOOGLE_REFRESH_TOKEN=1//0gxxxYOUR_NEW_REFRESH_TOKENxxx
```

Save the file.

## Step 6: Restart the server

Stop the server (Ctrl+C) and restart it:

```powershell
node server.js
```

## Step 7: Test the create-draft-gmail endpoint

Now you can test the endpoint. First register a user and get a JWT:

```powershell
$regBody = @{ 
  email = "testuser@example.com"
  password = "TestPass123!"
  name = "Test User"
} | ConvertTo-Json

$regRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $regBody -ContentType "application/json"
$jwt = $regRes.token
```

Then create a draft:

```powershell
$draftBody = @{ 
  to = "recipient@example.com"
  subject = "Test draft"
  body = "<p>This is a test draft</p>"
} | ConvertTo-Json

$draftRes = Invoke-RestMethod -Uri "http://localhost:5000/api/mail/create-draft-gmail" -Method Post -Headers @{ Authorization = "Bearer $jwt" } -Body $draftBody -ContentType "application/json"

# View response
$draftRes | ConvertTo-Json -Depth 5
```

Expected successful response:

```json
{
  "success": true,
  "message": "Gmail draft created",
  "draftId": "r-1234567890",
  "messageId": "1234567890abcdef",
  "data": { ... }
}
```

The draft will appear in the Gmail account's Drafts folder (the account specified in `GMAIL_FROM_ADDRESS`).

## Troubleshooting

### Error: "Request had insufficient authentication scopes"

This means the refresh token does not include the `gmail.compose` scope. You must:
1. Re-do the consent flow (steps 2-5 above)
2. Make sure `backend/routes/authGoogle.js` includes `gmail.compose` in the SCOPES array (it should after the recent update)
3. Use the new refresh token from the consent callback

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

This error is from `emailService` trying to use nodemailer SMTP with Gmail OAuth. It does not affect the draft creation endpoint (which uses Gmail API directly). The draft endpoint will work even if nodemailer SMTP fails during startup.

### The callback shows "refresh_token": null

If the refresh token is not returned:
- You may have already consented previously. The refresh token is only returned on first consent.
- Solution: Revoke the app's access at https://myaccount.google.com/permissions, then re-consent.
- Or make sure `prompt=consent` is in the auth URL (it already is in the code).
