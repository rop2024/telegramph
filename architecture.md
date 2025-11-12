# Telegraph Email Management System - Architecture Documentation

**Version:** 1.0.0  
**Last Updated:** November 12, 2025  
**Repository:** [rop2024/telegramph](https://github.com/rop2024/telegramph)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Database Design](#database-design)
7. [API Endpoints](#api-endpoints)
8. [Security Implementation](#security-implementation)
9. [Email Service Architecture](#email-service-architecture)
10. [Development Workflow](#development-workflow)
11. [Deployment Architecture](#deployment-architecture)

---

## System Overview

### Purpose
Telegraph is a comprehensive email management system designed for creating, managing, and tracking email campaigns. It provides robust draft management, receiver organization, email sending with tracking capabilities, and detailed analytics.

### Core Features
- **User Authentication**: JWT-based authentication with email verification and password reset
- **Receiver Management**: CRUD operations for email recipients with tagging and categorization
- **Draft Management**: Email draft creation with versioning, templating, and scheduling
- **Gmail OAuth2 Integration**: Full Gmail API integration for sending emails and creating drafts
- **Email Sending**: Multiple sending methods (Gmail API, SMTP) with rate limiting and retry mechanisms
- **Gmail Draft Creation**: Create drafts directly in Gmail account's Drafts folder
- **Email Tracking**: Open tracking (pixel), click tracking, and delivery status monitoring
- **Analytics**: Comprehensive email performance metrics and campaign analytics
- **Security**: AES-256-GCM encryption for sensitive data, bcrypt password hashing, OAuth2 token management

### System Architecture
```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │◄───────►│  Express API    │◄───────►│  MongoDB Atlas  │
│  (Vite + React) │  HTTP   │  (Node.js)      │  ODM    │  (Cloud DB)     │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                     │
                                     │
                         ┌───────────┴───────────┐
                         │                       │
                         ▼                       ▼
                ┌─────────────────┐     ┌─────────────────┐
                │                 │     │                 │
                │  Gmail API      │     │  Email Provider │
                │  (OAuth2)       │     │  (SMTP Fallback)│
                │  - Send Email   │     │                 │
                │  - Create Draft │     │                 │
                └─────────────────┘     └─────────────────┘
```

---

## Technology Stack

### Backend Stack

#### Core Technologies
- **Runtime**: Node.js (≥18.0.0)
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB Atlas (Cloud) with Mongoose 8.19.2 ODM
- **Language**: JavaScript (CommonJS modules)

#### Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| express | 5.1.0 | Web application framework |
| mongoose | 8.19.2 | MongoDB object modeling |
| jsonwebtoken | 9.0.2 | JWT authentication tokens |
| bcryptjs | 3.0.3 | Password hashing |
| nodemailer | 7.0.10 | Email sending service (SMTP) |
| googleapis | 164.1.0 | Google Gmail API integration |
| express-validator | 7.3.0 | Request validation |
| crypto-js | 4.2.0 | AES encryption utilities |
| cors | 2.8.5 | Cross-origin resource sharing |
| dotenv | 17.2.3 | Environment variable management |
| axios | 1.13.2 | HTTP client for external APIs |

#### Development Tools
- **nodemon** 3.1.10 - Auto-restart server on changes
- Custom test scripts for API endpoint testing

### Frontend Stack

#### Core Technologies
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.11 (Fast HMR, optimized builds)
- **Language**: JavaScript/JSX (ES Modules)
- **Styling**: Tailwind CSS 3.4.15 with PostCSS

#### Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3.1 | UI component library |
| react-dom | 18.3.1 | React DOM rendering |
| react-router-dom | 6.28.0 | Client-side routing |
| axios | 1.7.9 | API communication |
| lucide-react | 0.263.1 | Icon components |
| tailwindcss | 3.4.15 | Utility-first CSS framework |
| postcss | 8.4.49 | CSS processing |
| autoprefixer | 10.4.20 | CSS vendor prefixing |

#### Build Configuration
- **Vite Plugin**: @vitejs/plugin-react 4.3.4
- **Dev Server**: Port 3000 with HMR
- **API Proxy**: Forwards `/api/*` to `http://localhost:5000`

---

## Architecture Patterns

### Backend Patterns

#### 1. **MVC (Model-View-Controller) Pattern**
```
Models (Data Layer)
    ↓
Routes (Controller Layer)
    ↓
Client Response (View Layer)
```

#### 2. **Middleware Chain Pattern**
```
Request → CORS → Body Parser → Route Middleware → Auth Middleware → Controller → Response
```

#### 3. **Repository Pattern**
- Mongoose models act as data repositories
- Business logic separated from data access
- Reusable query methods in model static functions

#### 4. **Service Layer Pattern**
- `emailService.js`: Encapsulates email sending logic
- `crypto.js`: Handles encryption/decryption operations
- Promotes code reusability and testability

### Frontend Patterns

#### 1. **Component-Based Architecture**
```
App
├── Layout (Sidebar + Header)
│   ├── Dashboard
│   ├── Receivers (CRUD)
│   ├── Drafts (CRUD)
│   └── Logs (Read-only)
└── Auth Pages
    ├── Login
    └── Register
```

#### 2. **Container/Presentational Pattern**
- Pages handle state and API calls (Container)
- Reusable components for UI (Presentational)

#### 3. **Protected Route Pattern**
- `ProtectedRoute` component wraps authenticated routes
- Redirects to login if no token
- Validates token on mount

#### 4. **Context API for State**
- `AuthContext`: User authentication state
- Shared across components without prop drilling

---

## Backend Architecture

### Directory Structure
```
backend/
├── config/
│   └── db.js                 # MongoDB connection configuration
├── middleware/
│   └── auth.js               # JWT authentication middleware
├── models/
│   ├── User.js               # User schema with auth methods
│   ├── Receiver.js           # Email receiver schema with encryption
│   ├── Draft.js              # Email draft schema with versioning
│   └── MailLog.js            # Email tracking and logs schema
├── routes/
│   ├── authRoutes.js         # Authentication endpoints
│   ├── authGoogle.js         # Google OAuth consent flow
│   ├── receiverRoutes.js     # Receiver CRUD endpoints
│   ├── draftRoutes.js        # Draft CRUD endpoints
│   └── mailRoutes.js         # Email sending, tracking, Gmail API endpoints
├── utils/
│   ├── crypto.js             # AES-256-GCM encryption utilities
│   └── emailService.js       # Gmail OAuth2 & Nodemailer service class
├── scripts/
│   ├── testCreateDraft.js    # Automated test for Gmail draft creation
│   └── getRefreshToken.md    # Guide for obtaining OAuth refresh token
├── test-draft.js             # Draft API automated tests
├── test-mail.js              # Mail API automated tests
├── server.js                 # Express app entry point
├── package.json              # Dependencies and scripts
└── .env                      # Environment variables (not in git)
```

### Core Components

#### 1. **Server Entry Point (`server.js`)**
```javascript
// Key responsibilities:
- Load environment variables
- Connect to MongoDB
- Configure CORS for frontend communication
- Mount API route handlers
- Global error handling
- Health check endpoints
- Graceful shutdown handling
```

**Endpoints:**
- `GET /api/health` - Server status check
- `GET /api/db-status` - Database connection status

**Port Configuration:**
- Default: 5000
- Configurable via `PORT` environment variable

#### 2. **Database Configuration (`config/db.js`)**
```javascript
// MongoDB Connection:
- Uses Mongoose for ODM
- Connects to MongoDB Atlas (cloud)
- Connection string from MONGODB_URI env var
- No deprecated options (useNewUrlParser, useUnifiedTopology removed)
- Automatic reconnection handling
```

#### 3. **Authentication Middleware (`middleware/auth.js`)**
```javascript
// JWT Verification:
- Extracts token from Authorization header (Bearer token)
- Verifies token signature using JWT_SECRET
- Attaches user object to request (req.user)
- Returns 401 for invalid/expired tokens
```

**Usage:**
```javascript
router.get('/protected-route', protect, controllerFunction);
```

---

## Database Design

### MongoDB Collections

#### 1. **Users Collection**

**Schema Definition:**
```javascript
{
  email: String (required, unique, lowercase, validated)
  password: String (required, min 8 chars, hashed with bcrypt)
  firstName: String (required, max 50 chars)
  lastName: String (required, max 50 chars)
  isEmailVerified: Boolean (default: false)
  emailVerificationToken: String (hashed)
  emailVerificationExpires: Date
  passwordResetToken: String (hashed)
  passwordResetExpires: Date
  lastLogin: Date
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `email` (unique)
- `emailVerificationToken`
- `passwordResetToken`

**Methods:**
- `matchPassword(enteredPassword)` - Compare bcrypt hashes
- `getSignedJwtToken()` - Generate JWT token
- `generateEmailVerificationToken()` - Create verification token (24hr expiry)
- `generatePasswordResetToken()` - Create reset token (10min expiry)

**Pre-save Hooks:**
- Hash password with bcrypt (10 rounds) if modified
- Convert email to lowercase

#### 2. **Receivers Collection**

**Schema Definition:**
```javascript
{
  userId: ObjectId (ref: User, required, indexed)
  name: String (required, max 100 chars)
  email: String (required, encrypted with AES-256-GCM)
  company: String (max 100 chars)
  department: String (max 50 chars)
  tags: [String] (indexed)
  notes: String (max 500 chars)
  status: String (enum: active, inactive, bounced, unsubscribed, default: active)
  lastEmailSent: Date
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `userId`
- `tags`
- Compound: `{userId: 1, status: 1}`

**Security:**
- Email field encrypted using AES-256-GCM before save
- Decryption required before sending emails
- Encryption key from ENCRYPTION_SECRET env var

**Virtual Fields:**
- `decryptedEmail` - Returns plain email (not persisted)

#### 3. **Drafts Collection**

**Schema Definition:**
```javascript
{
  userId: ObjectId (ref: User, required, indexed)
  title: String (required, max 200 chars)
  subject: String (required)
  body: String (required)
  receivers: [ObjectId] (ref: Receiver)
  cc: [String] (email addresses)
  bcc: [String] (email addresses)
  attachments: [{
    filename: String
    path: String
    contentType: String
    size: Number
    uploadedAt: Date (default: now)
  }]
  status: String (enum: draft, scheduled, sent, archived, default: draft, indexed)
  lastEdited: Date (default: now, auto-updated)
  version: Number (default: 1, auto-incremented)
  isPublic: Boolean (default: false)
  category: String (indexed)
  tags: [String] (indexed)
  scheduledFor: Date
  metadata: Map (flexible key-value storage)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `userId`
- `status`
- `category`
- `tags`
- Compound: `{userId: 1, status: 1}`

**Virtual Fields:**
- `receiverCount` - Number of receivers
- `attachmentCount` - Number of attachments
- `totalAttachmentSize` - Sum of attachment sizes

**Static Methods:**
- `getByStatus(userId, status, options)` - Query with pagination
- `getStats(userId)` - Aggregate statistics

**Instance Methods:**
- `duplicate()` - Create copy with version reset
- `addReceiver(receiverId)` - Add receiver to draft
- `removeReceiver(receiverId)` - Remove receiver from draft
- `updateStatus(newStatus)` - Change draft status

**Pre-save Hooks:**
- Update `lastEdited` timestamp
- Increment `version` if subject/body changed

#### 4. **MailLogs Collection**

**Schema Definition:**
```javascript
{
  userId: ObjectId (ref: User, required, indexed)
  draftId: ObjectId (ref: Draft, indexed)
  receiverId: ObjectId (ref: Receiver, indexed)
  receiverName: String
  receiverEmail: String (encrypted)
  subject: String (required)
  body: String
  messageId: String (unique, sparse, indexed)
  trackingId: String (unique, sparse, indexed, auto-generated)
  status: String (enum: pending, sent, delivered, failed, bounced, opened, clicked, default: pending, indexed)
  sentAt: Date
  deliveredAt: Date
  openedAt: Date
  clickedAt: Date
  errorMessage: String
  emailProvider: String
  providerMessageId: String
  retryCount: Number (default: 0, max: 3)
  lastRetryAt: Date
  previewUrl: String (Ethereal preview link)
  metadata: Map (flexible key-value storage)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `userId`
- `draftId`
- `receiverId`
- `messageId` (unique, sparse)
- `trackingId` (unique, sparse)
- `status`
- Compound: `{userId: 1, status: 1}`
- Compound: `{userId: 1, sentAt: -1}`

**Static Methods:**
- `getSendingStats(userId, filters)` - Email statistics with aggregation
  - Total sent, delivered, failed, bounced
  - Open and click rates
  - Groups by time period
- `getCampaignPerformance(userId, draftId)` - Per-campaign metrics

**Instance Methods:**
- `markAsSent(messageId, sentAt, previewUrl)` - Update to sent status
- `markAsDelivered()` - Update to delivered status
- `markAsFailed(errorMessage)` - Update to failed status
- `recordOpen()` - Set openedAt timestamp and status
- `recordClick()` - Set clickedAt timestamp and status

**Pre-save Hooks:**
- Generate unique `trackingId` using crypto.randomBytes(16)

---

## API Endpoints

### Authentication Routes (`/api/auth`)

#### 1. **Register User**
```
POST /api/auth/register
Body: { email, password, firstName, lastName }
Response: { success, data: { user, token } }
```

**Validation:**
- Email format validation
- Password minimum 8 characters
- All fields required

**Process:**
1. Check if user exists (409 if duplicate)
2. Hash password with bcrypt (10 rounds)
3. Create user in database
4. Generate JWT token (30 days expiry)
5. Return user object (password excluded) and token

#### 2. **Login User**
```
POST /api/auth/login
Body: { email, password }
Response: { success, data: { user, token } }
```

**Process:**
1. Find user by email (include password field)
2. Verify password with bcrypt comparison
3. Update lastLogin timestamp
4. Generate JWT token
5. Return user and token

#### 3. **Get Current User**
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { success, data: user }
```

**Middleware:** `protect` (JWT verification)

#### 4. **Verify Email**
```
POST /api/auth/verify-email
Body: { token }
Response: { success, message }
```

**Process:**
1. Hash provided token with SHA-256
2. Find user with matching token and valid expiry
3. Set isEmailVerified to true
4. Clear verification token fields

#### 5. **Request Password Reset**
```
POST /api/auth/forgot-password
Body: { email }
Response: { success, message }
```

**Process:**
1. Find user by email
2. Generate reset token (10 minutes expiry)
3. Send reset email (in production)
4. Return success message

#### 6. **Reset Password**
```
POST /api/auth/reset-password
Body: { token, newPassword }
Response: { success, message }
```

**Process:**
1. Hash token and find user with valid expiry
2. Update password (triggers bcrypt hashing)
3. Clear reset token fields
4. Save user

---

### Google OAuth Routes (`/api/auth/google`)

#### 7. **Get OAuth Consent URL**
```
GET /api/auth/google/url
Response: { url: "https://accounts.google.com/o/oauth2/v2/auth?..." }
```

**Purpose:**
- Generate Google OAuth2 consent URL
- User visits URL to authorize Gmail access
- Required scopes: gmail.send, gmail.compose, email, profile, openid

**Process:**
1. Initialize OAuth2Client with CLIENT_ID and CLIENT_SECRET
2. Generate authorization URL with:
   - access_type: 'offline' (for refresh token)
   - prompt: 'consent' (force consent screen)
   - scope: ['gmail.send', 'gmail.compose', 'email', 'profile', 'openid']
3. Return URL to frontend

#### 8. **OAuth Callback Handler**
```
GET /api/auth/google/callback?code=<authorization_code>
Response: { 
  access_token, 
  refresh_token, 
  scope, 
  token_type, 
  expiry_date 
}
```

**Purpose:**
- Exchange authorization code for access/refresh tokens
- Obtain refresh token for server-side Gmail API access

**Process:**
1. Extract authorization code from query parameter
2. Call oauth2Client.getToken(code)
3. Return complete token response including refresh_token
4. Store refresh_token in .env as GOOGLE_REFRESH_TOKEN

**Security:**
- Redirect URI must match Google Cloud Console configuration
- Code is single-use and expires in 10 minutes
- Refresh token only returned on first consent or when prompt=consent

---

### Receiver Routes (`/api/receivers`)

**All routes require authentication (`protect` middleware)**

#### 1. **Get All Receivers**
```
GET /api/receivers?search=<term>&status=<status>&tags=<tag1,tag2>&page=1&limit=20&sort=-createdAt
Response: { success, count, pagination, data: [receivers] }
```

**Query Parameters:**
- `search` - Search name/company/department
- `status` - Filter by status
- `tags` - Comma-separated tag filter
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20, max: 100)
- `sort` - Sort field with direction (e.g., -createdAt for desc)

**Response Includes:**
- Decrypted emails in response
- Pagination metadata (total, pages, current)

#### 2. **Get Single Receiver**
```
GET /api/receivers/:id
Response: { success, data: receiver }
```

**Security:**
- Verifies receiver belongs to authenticated user
- Returns decrypted email

#### 3. **Create Receiver**
```
POST /api/receivers
Body: { name, email, company, department, tags, notes, status }
Response: { success, data: receiver }
```

**Validation:**
- Name and email required
- Valid email format
- Duplicate email check for user

**Process:**
1. Validate input
2. Check for duplicate email (per user)
3. Encrypt email field
4. Create receiver
5. Return with decrypted email

#### 4. **Update Receiver**
```
PUT /api/receivers/:id
Body: { name, email, company, department, tags, notes, status }
Response: { success, data: receiver }
```

**Security:**
- Ownership verification
- Email re-encryption if changed

#### 5. **Delete Receiver**
```
DELETE /api/receivers/:id
Response: { success, message }
```

**Cascade:**
- Removes receiver from all drafts
- Keeps historical mail logs intact

#### 6. **Bulk Delete Receivers**
```
DELETE /api/receivers/bulk/delete
Body: { receiverIds: [id1, id2, ...] }
Response: { success, deletedCount, message }
```

**Process:**
- Validates all receivers belong to user
- Deletes in single operation
- Updates affected drafts

#### 7. **Get Receiver Statistics**
```
GET /api/receivers/stats/summary
Response: { success, data: { total, byStatus, byTags, recent } }
```

**Aggregations:**
- Total count
- Count by status
- Count by tags
- Recent additions

---

### Draft Routes (`/api/drafts`)

**All routes require authentication (`protect` middleware)**

#### 1. **Get All Drafts**
```
GET /api/drafts?status=<status>&category=<cat>&search=<term>&tags=<tag1,tag2>&page=1&limit=20&sort=-lastEdited
Response: { success, count, pagination, data: [drafts] }
```

**Query Parameters:**
- `status` - Filter by status
- `category` - Filter by category
- `search` - Search title/subject/body
- `tags` - Comma-separated tags
- `page`, `limit`, `sort` - Pagination

**Populates:**
- Receiver objects (with decrypted emails)
- Virtual fields (receiverCount, etc.)

#### 2. **Get Single Draft**
```
GET /api/drafts/:id
Response: { success, data: draft }
```

**Includes:**
- Populated receivers with decrypted data
- All virtual fields

#### 3. **Create Draft**
```
POST /api/drafts
Body: { title, subject, body, receivers, cc, bcc, attachments, status, category, tags, scheduledFor, metadata }
Response: { success, data: draft }
```

**Validation:**
- Title, subject, body required
- Receivers must exist and belong to user
- Status enum validation

**Defaults:**
- version: 1
- status: 'draft'
- lastEdited: now

#### 4. **Update Draft**
```
PUT /api/drafts/:id
Body: { title, subject, body, receivers, cc, bcc, status, category, tags, scheduledFor }
Response: { success, data: draft }
```

**Process:**
1. Verify ownership
2. Validate receivers if changed
3. Update fields (triggers version increment if subject/body changed)
4. Update lastEdited timestamp

#### 5. **Delete Draft**
```
DELETE /api/drafts/:id
Response: { success, message }
```

**Cascade:**
- Associated mail logs remain for audit

#### 6. **Duplicate Draft**
```
POST /api/drafts/:id/duplicate
Response: { success, data: newDraft }
```

**Uses Instance Method:**
- Creates copy with " (Copy)" suffix
- Resets version to 1
- Resets status to 'draft'

#### 7. **Bulk Delete Drafts**
```
DELETE /api/drafts/bulk/delete
Body: { draftIds: [id1, id2, ...] }
Response: { success, deletedCount, message }
```

#### 8. **Update Draft Status**
```
PATCH /api/drafts/:id/status
Body: { status }
Response: { success, data: draft }
```

**Uses Instance Method:**
- Validates status enum
- Updates timestamp

#### 9. **Get Draft Statistics**
```
GET /api/drafts/stats/summary
Response: { success, data: { total, byStatus, byCategory, recentActivity } }
```

**Aggregations:**
- Total drafts
- Count by status
- Count by category
- Recent 10 drafts

#### 10. **Add Receiver to Draft**
```
POST /api/drafts/:id/receivers
Body: { receiverId }
Response: { success, data: draft }
```

**Validation:**
- Receiver must exist and belong to user
- Prevents duplicates

#### 11. **Remove Receiver from Draft**
```
DELETE /api/drafts/:id/receivers/:receiverId
Response: { success, data: draft }
```

---

### Mail Routes (`/api/mail`)

#### Public Routes (No Authentication)

##### 1. **Track Email Open**
```
GET /api/mail/track/:trackingId/pixel.gif
Response: 1x1 transparent GIF image
```

**Process:**
1. Find mail log by trackingId
2. Call `recordOpen()` instance method (updates openedAt, status to 'opened')
3. Return 1x1 transparent GIF (Content-Type: image/gif)

**Embedded in Emails:**
```html
<img src="http://api.domain.com/api/mail/track/{trackingId}/pixel.gif" width="1" height="1" />
```

##### 2. **Track Link Click**
```
GET /api/mail/track/:trackingId/click?url=<encoded_url>
Response: 302 Redirect to original URL
```

**Process:**
1. Find mail log by trackingId
2. Call `recordClick()` instance method (updates clickedAt, status to 'clicked')
3. Decode and redirect to original URL

**Link Wrapping:**
```html
<a href="http://api.domain.com/api/mail/track/{trackingId}/click?url=https%3A%2F%2Fexample.com">Link</a>
```

#### Protected Routes (Require Authentication)

##### 3. **Send Test Email**
```
POST /api/mail/send-test
Headers: Authorization: Bearer <token>
Body: { to, subject, text }
Response: { success, messageId, previewUrl }
```

**Purpose:**
- Quick email testing without creating draft/receiver
- Always requires JWT authentication
- Uses Gmail OAuth2 or SMTP fallback

**Process:**
1. Verify JWT authentication
2. Send email via emailService.sendMail()
3. Return explicit messageId and previewUrl at response root level
4. Preview URL only available in development mode

##### 3.1. **Send Email via Gmail API**
```
POST /api/mail/send-gmail
Headers: Authorization: Bearer <token>
Body: { to, subject, text, html? }
Response: { success, id, threadId, labelIds }
```

**Purpose:**
- Send email directly through Gmail API
- Email appears in sender's Sent folder
- Full Gmail integration with labels

**Process:**
1. Verify JWT authentication
2. Initialize Gmail OAuth2 client
3. Create RFC 2822 MIME message
4. Base64url encode message
5. Call gmail.users.messages.send()
6. Return Gmail message ID and labels

##### 3.2. **Create Gmail Draft**
```
POST /api/mail/create-draft-gmail
Headers: Authorization: Bearer <token>
Body: { to, subject, text, html? }
Response: { success, draftId, messageId, message }
```

**Purpose:**
- Create draft visible in Gmail Drafts folder
- Can be edited and sent from Gmail interface
- Uses Gmail API for native integration

**Process:**
1. Verify JWT authentication
2. Initialize Gmail OAuth2 client
3. Create RFC 2822 MIME message
4. Base64url encode message
5. Call gmail.users.drafts.create()
6. Return Gmail draft ID and message ID

##### 4. **Send Single Email**
```
POST /api/mail/send
Headers: Authorization: Bearer <token>
Body: { draftId, receiverId, cc, bcc }
Response: { success, message, data: { mailLog, previewUrl } }
```

**Process:**
1. Fetch draft and receiver (verify ownership)
2. Decrypt receiver email
3. Process body with tracking:
   - Inject tracking pixel
   - Wrap all links with click tracking
4. Send email via emailService
5. Create mail log with status 'sent'
6. Return mail log and preview URL

##### 5. **Send Bulk Emails**
```
POST /api/mail/send-bulk
Headers: Authorization: Bearer <token>
Body: { draftId, receiverIds, cc, bcc, delayBetweenEmails }
Response: { success, message, data: { totalSent, failed, successfulLogs, failedLogs } }
```

**Process:**
1. Fetch draft and all receivers (verify ownership)
2. Decrypt all receiver emails in bulk
3. Loop through receivers with delay between sends
4. For each receiver:
   - Process body with unique tracking
   - Send email
   - Create mail log
5. Return summary with successful/failed counts

**Rate Limiting:**
- Default delay: 1000ms (configurable)
- Prevents SMTP throttling

##### 6. **Get Mail Logs**
```
GET /api/mail/logs?status=<status>&draftId=<id>&receiverId=<id>&startDate=<date>&endDate=<date>&page=1&limit=50&sort=-sentAt
Response: { success, count, pagination, data: [mailLogs] }
```

**Query Filters:**
- `status` - Filter by email status
- `draftId` - Filter by draft
- `receiverId` - Filter by receiver
- `startDate`, `endDate` - Date range for sentAt
- Pagination and sorting

**Optimizations:**
- Uses `.lean()` for faster queries
- Populates draft and receiver references

##### 7. **Get Email Analytics**
```
GET /api/mail/analytics?period=<7d|30d|90d>&startDate=<date>&endDate=<date>
Response: { success, data: { totalSent, deliveryRate, openRate, clickRate, bounceRate, failureRate, statusBreakdown, timeSeriesData } }
```

**Metrics Calculated:**
- Total sent emails
- Delivery rate (delivered / sent)
- Open rate (opened / delivered)
- Click rate (clicked / opened)
- Bounce rate (bounced / sent)
- Failure rate (failed / sent)
- Status breakdown (count by status)
- Time series data (daily/weekly aggregations)

**Uses Static Method:**
- `MailLog.getSendingStats(userId, filters)`

##### 8. **Get Email Service Status**
```
GET /api/mail/status
Response: { success, data: { isConnected, provider, accountInfo } }
```

**Returns:**
- SMTP connection status
- Email provider details
- Test account credentials (Ethereal)

##### 9. **Retry Failed Email**
```
POST /api/mail/retry/:mailLogId
Response: { success, message, data: mailLog }
```

**Process:**
1. Find mail log (must be failed/bounced)
2. Check retry count (max 3 attempts)
3. Re-send email with same tracking ID
4. Update mail log (increment retryCount, update status)

**Retry Limits:**
- Maximum 3 retries per email
- Updates lastRetryAt timestamp

---

## Security Implementation

### 1. **Authentication & Authorization**

#### JWT (JSON Web Tokens)
```javascript
// Token Generation:
- Payload: { id: user._id }
- Secret: JWT_SECRET (256-bit random string)
- Expiry: JWT_EXPIRE (default: 30 days)
- Algorithm: HS256

// Token Verification:
- Middleware: protect
- Extracts from: Authorization: Bearer <token>
- Validates signature and expiry
- Attaches user to req.user
```

#### OAuth2 Token Management (Gmail)
```javascript
// OAuth2 Flow:
- Client ID and Secret from Google Cloud Console
- Authorization code exchange for tokens
- Refresh token stored in environment variables
- Access token obtained automatically via refresh token
- Token expiry handled by googleapis library

// Security Considerations:
- Refresh tokens are long-lived credentials
- Store securely (environment variables, secrets manager)
- Never expose in client-side code
- Rotate if compromised
- Scope-specific (cannot upgrade; must re-consent)
```

#### Password Security
```javascript
// Hashing:
- Algorithm: bcrypt
- Salt rounds: 10
- Pre-save hook on User model
- Only hashes if password modified

// Comparison:
- Instance method: matchPassword(enteredPassword)
- Uses bcrypt.compare() for timing-attack resistance
```

### 2. **Data Encryption**

#### AES-256-GCM Encryption
```javascript
// Configuration:
- Algorithm: aes-256-gcm
- Key derivation: scryptSync(ENCRYPTION_SECRET, salt, 32)
- IV: 12 random bytes per encryption
- AAD: Additional Authenticated Data for integrity

// Encrypted Data Format:
{
  iv: "hex string",           // Initialization vector
  encryptedData: "hex string", // Ciphertext
  authTag: "hex string"        // Authentication tag
}

// Usage:
- Receiver.email - Encrypted at rest
- All sensitive PII encrypted before database storage
```

**Functions:**
- `encryptAES(text)` - Returns { iv, encryptedData, authTag }
- `decryptAES(encryptedObject)` - Returns plaintext
- `bulkDecryptSensitiveFields(receivers)` - Decrypts multiple receivers

### 3. **Input Validation**

#### Express Validator
```javascript
// Route-level Validation:
- Email format validation
- String length limits
- Required field checks
- Type validation (ObjectId, Date, etc.)

// Example:
[
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty().isLength({ max: 100 })
]
```

### 4. **Security Headers & CORS**

#### CORS Configuration
```javascript
cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
})
```

**Prevents:**
- Cross-site request forgery (CSRF)
- Unauthorized API access from other domains

### 5. **Environment Variables**

**Critical Secrets (.env):**
```env
# Database
MONGODB_URI=mongodb+srv://...

# JWT Authentication
JWT_SECRET=<256-bit random string>
JWT_EXPIRE=30d

# Encryption
ENCRYPTION_SECRET=<strong passphrase>

# Gmail OAuth2 (Recommended)
USE_GMAIL_OAUTH=true
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REFRESH_TOKEN=<obtained via /api/auth/google/callback>
GMAIL_FROM_ADDRESS=telegramph025@gmail.com

# Email SMTP Fallback (Optional)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=<auto-generated>
EMAIL_PASS=<auto-generated>

# Client
CLIENT_URL=http://localhost:3000
```

**Gmail OAuth Setup:**
1. Create project in Google Cloud Console
2. Enable Gmail API
3. Create OAuth2 credentials (Web Application)
4. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
5. Visit `/api/auth/google/url` to generate consent URL
6. Authorize and copy refresh_token from callback response
7. Set GOOGLE_REFRESH_TOKEN in .env

**OAuth Scopes Required:**
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/gmail.compose` - Create/modify drafts
- `https://www.googleapis.com/auth/userinfo.email` - User email
- `https://www.googleapis.com/auth/userinfo.profile` - User profile
- `openid` - OpenID Connect authentication

**Security Best Practices:**
- Never commit .env to version control
- Use strong random secrets (>= 256 bits)
- Rotate secrets periodically
- Use different secrets per environment
- Refresh tokens are long-lived; protect them like passwords
- Re-consent required if changing OAuth scopes

### 6. **Rate Limiting & Abuse Prevention**

#### Email Rate Limiting
```javascript
// Bulk Email Sending:
- Default delay: 1000ms between emails
- Configurable per request
- Prevents SMTP throttling
- Max retry attempts: 3 per email
```

#### Request Size Limits
```javascript
express.json({ limit: '10mb' })
express.urlencoded({ limit: '10mb' })
```

### 7. **Error Handling**

#### Secure Error Messages
```javascript
// Production:
- Generic error messages to client
- No stack traces exposed
- Detailed logs server-side only

// Development:
- Full error details in response
- Stack traces for debugging
```

---

## Email Service Architecture

### EmailService Class (`utils/emailService.js`)

#### Initialization
```javascript
class EmailService {
  constructor() {
    this.transporter = null;
    this.oauth2Client = null;
    this.gmail = null;
  }

  async init() {
    // Gmail OAuth2 Setup (Primary)
    if (process.env.USE_GMAIL_OAUTH === 'true') {
      1. Initialize OAuth2Client with CLIENT_ID, CLIENT_SECRET, REDIRECT_URI
      2. Set credentials with GOOGLE_REFRESH_TOKEN
      3. Obtain access token via oauth2Client.getAccessToken()
      4. Create nodemailer transporter with OAuth2 configuration
      5. Initialize Gmail API client: google.gmail({ version: 'v1', auth })
      6. Verify SMTP connection (graceful failure handling)
    }
    
    // SMTP Fallback
    else {
      1. Use nodemailer with standard SMTP credentials
      2. Or create Ethereal test account in development
      3. Verify connection
    }
  }
}
```

**Gmail OAuth2 Configuration:**
```javascript
transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.GMAIL_FROM_ADDRESS,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    accessToken: accessToken.token
  },
  logger: false,  // Disable verbose logs
  debug: false    // Disable debug output
});
```

**Logging Output:**
```
📧 Initializing Gmail OAuth2 transporter
🔑 Using Gmail account: telegramph025@gmail.com
🔐 Obtaining access token via OAuth2...
✅ Access token obtained
✅ Gmail OAuth2 transporter initialized successfully
⚠️ SMTP verification failed (common with Gmail OAuth, API calls still work)
```

#### Core Methods

##### 1. **sendEmail(emailOptions, mailLogId)**
```javascript
// Parameters:
{
  to: 'receiver@example.com',
  subject: 'Email Subject',
  html: '<p>Email body with HTML</p>',
  cc: ['cc1@example.com'],
  bcc: ['bcc1@example.com'],
  attachments: [{ filename, path, contentType }]
}

// Process:
1. Send via transporter.sendMail()
2. Extract messageId from response
3. Update mail log to 'sent' status
4. Log: "📧 Email sent successfully | From: ... | To: ... | Subject: ... | MessageID: ..."
5. Return { messageId, previewUrl }

// Error Handling:
- Updates mail log to 'failed' on error
- Logs error message
- Throws error for upstream handling
```

##### 2. **sendBulkEmails(emailsArray, delayMs)**
```javascript
// Parameters:
emailsArray = [
  { to, subject, html, mailLogId },
  ...
]

// Process:
1. Loop through email array
2. Call sendEmail() for each
3. Wait delayMs between sends
4. Collect results (successful/failed)
5. Return summary

// Return:
{
  successful: [{ to, messageId, previewUrl }, ...],
  failed: [{ to, error }, ...]
}
```

##### 3. **generateTrackingPixel(trackingId)**
```javascript
// Returns HTML:
<img src="http://api-url/api/mail/track/{trackingId}/pixel.gif" width="1" height="1" style="display:none" />

// Purpose:
- Embedded at end of email body
- Triggers on email open
- Records openedAt timestamp
```

##### 4. **generateTrackedLink(originalUrl, trackingId)**
```javascript
// Returns:
http://api-url/api/mail/track/{trackingId}/click?url={encodedOriginalUrl}

// Process:
- URL encodes original link
- Wraps with tracking endpoint
- Redirects to original after recording click
```

##### 5. **processBodyWithTracking(htmlBody, trackingId)**
```javascript
// Process:
1. Inject tracking pixel at end of body
2. Parse HTML for all <a> tags
3. Replace href with tracked links
4. Return modified HTML

// Example:
Input:  <a href="https://example.com">Link</a>
Output: <a href="http://api/track/{id}/click?url=...">Link</a>
```

##### 6. **getStatus()**
```javascript
// Returns:
{
  isConnected: true/false,
  provider: 'Gmail OAuth2' | 'SMTP' | 'Ethereal',
  accountInfo: {
    user: 'telegramph025@gmail.com',
    previewUrl: 'https://ethereal.email' // Only in dev mode
  }
}
```

### Gmail API Integration

**OAuth2 Setup Process:**
1. Visit `/api/auth/google/url` to get consent URL
2. User authorizes with Google account
3. Redirects to `/api/auth/google/callback?code=...`
4. Exchange code for tokens (access_token + refresh_token)
5. Store GOOGLE_REFRESH_TOKEN in .env
6. Server uses refresh token to obtain access tokens automatically

**Required Scopes:**
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/gmail.compose` - Create/modify drafts
- `https://www.googleapis.com/auth/userinfo.email` - User email
- `https://www.googleapis.com/auth/userinfo.profile` - User profile
- `openid` - OpenID Connect authentication

**Gmail API Methods:**

**Create Draft:**
```javascript
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

const rawMessage = [
  `From: ${from}`,
  `To: ${to}`,
  `Subject: ${subject}`,
  '',
  text
].join('\n');

const encodedMessage = Buffer.from(rawMessage)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

const response = await gmail.users.drafts.create({
  userId: 'me',
  requestBody: {
    message: { raw: encodedMessage }
  }
});

// Returns: { draftId, messageId }
```

**Send Email via Gmail API:**
```javascript
const response = await gmail.users.messages.send({
  userId: 'me',
  requestBody: {
    raw: encodedMessage
  }
});

// Returns: { id, threadId, labelIds: ['SENT'] }
```

### Dual Email Path Strategy

**Gmail API (Primary):**
- Used for: `/send-gmail`, `/create-draft-gmail`
- Benefits: Native Gmail integration, appears in Sent folder, draft management
- Limitations: Requires OAuth consent, refresh token management

**SMTP with OAuth2 (Fallback):**
- Used for: `/send-test`, `/send` (bulk sends)
- Benefits: Works with tracking pixels, traditional email workflow
- Limitations: SMTP verification may fail (doesn't affect functionality)

**Development Mode:**
- Ethereal.email integration for testing
- Preview URLs provided in responses
- No actual email delivery

---

## Frontend Architecture

### Directory Structure
```
frontend/
├── public/
│   ├── index.html           # Vite entry point
│   ├── manifest.json        # PWA manifest
│   └── robots.txt           # SEO configuration
├── src/
│   ├── components/
│   │   ├── Layout.jsx       # Main layout with sidebar/header
│   │   └── ProtectedRoute.jsx # Auth route guard
│   ├── contexts/
│   │   └── AuthContext.jsx  # Global auth state
│   ├── pages/
│   │   ├── Dashboard.jsx    # Analytics dashboard
│   │   ├── Receivers.jsx    # Receiver CRUD with modal
│   │   ├── Drafts.jsx       # Draft CRUD with modal
│   │   ├── Logs.jsx         # Email logs view
│   │   ├── Login.jsx        # Authentication
│   │   └── Register.jsx     # User registration
│   ├── services/
│   │   └── api.js           # Axios API client
│   ├── App.jsx              # Root component with routing
│   ├── main.jsx             # React DOM render
│   └── index.css            # Tailwind + custom styles
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind customization
├── postcss.config.js        # PostCSS plugins
└── package.json             # Dependencies
```

### Core Components

#### 1. **App Component (`App.jsx`)**
```jsx
// Router Structure:
<BrowserRouter>
  <AuthProvider>
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/receivers" element={<Receivers />} />
          <Route path="/drafts" element={<Drafts />} />
          <Route path="/logs" element={<Logs />} />
        </Route>
      </Route>
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

#### 2. **Layout Component (`components/Layout.jsx`)**
```jsx
// Structure:
<div className="flex h-screen">
  {/* Sidebar */}
  <aside className="sidebar">
    <nav>
      <Link to="/">Dashboard</Link>
      <Link to="/receivers">Receivers</Link>
      <Link to="/drafts">Drafts</Link>
      <Link to="/logs">Mail Logs</Link>
    </nav>
    <button onClick={logout}>Logout</button>
  </aside>
  
  {/* Main Content */}
  <main className="flex-1">
    <Outlet /> {/* Renders child routes */}
  </main>
</div>
```

**Features:**
- Persistent sidebar navigation
- Active link highlighting
- User info display
- Logout functionality

#### 3. **ProtectedRoute Component**
```jsx
// Logic:
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  
  return <Outlet />;
};
```

**Purpose:**
- Prevents unauthenticated access
- Redirects to login if no token
- Shows loading state during auth check

#### 4. **AuthContext (`contexts/AuthContext.jsx`)**
```jsx
// State:
{
  user: { id, email, firstName, lastName } || null,
  loading: boolean,
  token: string || null
}

// Methods:
- login(email, password)
- register(userData)
- logout()
- checkAuth() // Validates token on mount

// Usage:
const { user, login, logout } = useAuth();
```

### API Service Layer (`services/api.js`)

#### Axios Configuration
```javascript
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Request Interceptor:
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor:
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### API Modules

##### Authentication API
```javascript
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  verifyEmail: (token) => API.post('/auth/verify-email', { token }),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => API.post('/auth/reset-password', { token, newPassword: password })
};
```

##### Receivers API
```javascript
export const receiversAPI = {
  getAll: (params) => API.get('/receivers', { params }),
  getById: (id) => API.get(`/receivers/${id}`),
  create: (data) => API.post('/receivers', data),
  update: (id, data) => API.put(`/receivers/${id}`, data),
  delete: (id) => API.delete(`/receivers/${id}`),
  bulkDelete: (ids) => API.delete('/receivers/bulk/delete', { data: { receiverIds: ids } }),
  getStats: () => API.get('/receivers/stats/summary')
};
```

##### Drafts API
```javascript
export const draftsAPI = {
  getAll: (params) => API.get('/drafts', { params }),
  getById: (id) => API.get(`/drafts/${id}`),
  create: (data) => API.post('/drafts', data),
  update: (id, data) => API.put(`/drafts/${id}`, data),
  delete: (id) => API.delete(`/drafts/${id}`),
  duplicate: (id) => API.post(`/drafts/${id}/duplicate`),
  bulkDelete: (ids) => API.delete('/drafts/bulk/delete', { data: { draftIds: ids } }),
  updateStatus: (id, status) => API.patch(`/drafts/${id}/status`, { status }),
  getStats: () => API.get('/drafts/stats/summary'),
  addReceiver: (id, receiverId) => API.post(`/drafts/${id}/receivers`, { receiverId }),
  removeReceiver: (id, receiverId) => API.delete(`/drafts/${id}/receivers/${receiverId}`)
};
```

##### Mail API
```javascript
export const mailAPI = {
  sendTest: (data) => API.post('/mail/send-test', data),
  sendSingle: (data) => API.post('/mail/send', data),
  sendBulk: (data) => API.post('/mail/send-bulk', data),
  getLogs: (params) => API.get('/mail/logs', { params }),
  getAnalytics: (params) => API.get('/mail/analytics', { params }),
  getStatus: () => API.get('/mail/status'),
  retry: (mailLogId) => API.post(`/mail/retry/${mailLogId}`)
};
```

### Page Components

#### Receivers Page (`pages/Receivers.jsx`)

**State Management:**
```javascript
const [receivers, setReceivers] = useState([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const [showModal, setShowModal] = useState(false);
const [editingReceiver, setEditingReceiver] = useState(null);
const [formData, setFormData] = useState({
  name: '',
  email: '',
  company: '',
  department: '',
  tags: '',
  notes: ''
});
```

**CRUD Operations:**
```javascript
// Create/Update:
handleSubmit = async (e) => {
  e.preventDefault();
  const data = {
    ...formData,
    tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
  };
  
  if (editingReceiver) {
    await receiversAPI.update(editingReceiver._id, data);
  } else {
    await receiversAPI.create(data);
  }
  
  fetchReceivers();
  handleCloseModal();
};

// Delete:
handleDelete = async (id) => {
  if (window.confirm('Delete receiver?')) {
    await receiversAPI.delete(id);
    fetchReceivers();
  }
};
```

**Modal UI:**
- Form with inputs for all fields
- Required indicators (*)
- Tag input with comma-separated hint
- Cancel and Submit buttons
- Overlay with click-to-close

#### Drafts Page (`pages/Drafts.jsx`)

**Similar Structure to Receivers:**
- Grid layout of draft cards
- Status badges (draft/scheduled/sent/archived)
- Action buttons (Edit, Duplicate, Send)
- Modal with draft fields

**Additional Features:**
```javascript
// Duplicate:
handleDuplicate = async (draftId) => {
  await draftsAPI.duplicate(draftId);
  fetchDrafts();
};

// Send (Placeholder):
handleSend = (draft) => {
  alert('Send functionality will be implemented soon.');
};
```

**Form Fields:**
- Title (required, max 200 chars)
- Subject (required)
- Body (textarea, required)
- Category
- Status (dropdown)
- Tags (comma-separated)

### Styling System

#### Tailwind Configuration
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8'
      },
      gray: { /* 50-900 scale */ }
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif']
    }
  }
}
```

#### Custom CSS Classes (`index.css`)
```css
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }
  
  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700;
  }
  
  .btn-secondary {
    @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
  }
  
  .btn-danger {
    @apply bg-red-600 text-white hover:bg-red-700;
  }
  
  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-sm border border-gray-200;
  }
  
  .sidebar-link {
    @apply flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 rounded-lg transition-colors;
  }
  
  .sidebar-link.active {
    @apply bg-primary-100 text-primary-700 font-medium;
  }
}
```

### Vite Configuration

#### Dev Server (`vite.config.js`)
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'build',
    sourcemap: true
  }
});
```

**Features:**
- React Fast Refresh (HMR)
- API proxy to backend
- Source maps for debugging
- Optimized production builds

---

## Development Workflow

### Setup & Installation

#### Backend Setup
```bash
cd backend
npm install
```

**Environment Configuration:**
```bash
# Create .env file:
cp .env.example .env

# Edit .env with your values:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
ENCRYPTION_SECRET=your-encryption-key
```

**Run Development Server:**
```bash
npm run dev  # Uses nodemon for auto-restart
```

#### Frontend Setup
```bash
cd frontend
npm install
```

**Run Development Server:**
```bash
npm run dev  # Vite dev server on port 3000
```

### Testing

#### Backend API Tests
```bash
cd backend

# Test draft functionality:
node test-draft.js

# Test mail functionality:
node test-mail.js
```

**Test Coverage:**
- Authentication (register, login)
- CRUD operations (receivers, drafts)
- Email sending (single, bulk)
- Tracking (open, click)
- Analytics queries

### Git Workflow

#### Commit Conventions
```
feat: New feature
fix: Bug fix
docs: Documentation updates
style: Code formatting
refactor: Code restructuring
test: Test updates
chore: Build/tooling changes
```

**Example Commits:**
```bash
git add .
git commit -m "feat: implement CRUD functionality for Receivers and Drafts pages with modal UI"
git push origin main
```

### Code Organization Best Practices

1. **Backend:**
   - Models: Single responsibility, virtual fields for computed data
   - Routes: Thin controllers, delegate to service layer
   - Middleware: Reusable, composable (protect, validate)
   - Utils: Pure functions, no side effects

2. **Frontend:**
   - Components: Small, focused, reusable
   - Pages: Container pattern, manage state and API calls
   - Services: Centralized API logic
   - Contexts: Global state only when needed

3. **Security:**
   - Never commit secrets
   - Validate all inputs
   - Encrypt sensitive data
   - Use HTTPS in production

---

## Deployment Architecture

### Production Considerations

#### Backend Deployment

**Environment:**
- **Platform**: Railway, Heroku, DigitalOcean, AWS EC2
- **Node Version**: >= 18.0.0
- **Process Manager**: PM2 for production

**Configuration:**
```bash
# Install PM2:
npm install -g pm2

# Start with PM2:
pm2 start server.js --name telegraph-api

# Configure auto-restart:
pm2 startup
pm2 save
```

**Environment Variables (Production):**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-cluster...
JWT_SECRET=<256-bit production secret>
ENCRYPTION_SECRET=<strong production passphrase>
CLIENT_URL=https://your-domain.com

# Gmail OAuth2 (Recommended for Production):
USE_GMAIL_OAUTH=true
GOOGLE_CLIENT_ID=<production client ID>
GOOGLE_CLIENT_SECRET=<production client secret>
GOOGLE_REFRESH_TOKEN=<production refresh token>
GMAIL_FROM_ADDRESS=noreply@your-domain.com

# Production Email SMTP Fallback (Optional):
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=<sendgrid-api-key>
```

**Gmail OAuth Production Setup:**
1. Create production project in Google Cloud Console
2. Enable Gmail API for project
3. Create OAuth2 credentials (Web Application)
4. Configure authorized redirect URIs:
   - `https://your-domain.com/api/auth/google/callback`
   - `https://api.your-domain.com/api/auth/google/callback`
5. Generate refresh token in production environment:
   - Deploy backend with CLIENT_ID and CLIENT_SECRET
   - Visit `https://api.your-domain.com/api/auth/google/url`
   - Authorize with production Gmail account
   - Copy refresh_token from callback response
6. Update GOOGLE_REFRESH_TOKEN in production environment
7. Restart application

**Gmail API Considerations:**
- Daily sending limit: 2,000 emails/day for standard Gmail
- Consider Google Workspace for higher limits (10,000/day)
- Monitor quota usage in Cloud Console
- Implement retry logic for quota exceeded errors

**Database:**
- **MongoDB Atlas**: Production cluster (M10+ recommended)
- **Backups**: Automated daily backups
- **Monitoring**: Atlas monitoring dashboard

#### Frontend Deployment

**Build Process:**
```bash
cd frontend
npm run build
# Generates optimized build in ./build directory
```

**Hosting Options:**
1. **Vercel** (Recommended)
   - Automatic deployments from Git
   - CDN distribution
   - HTTPS by default

2. **Netlify**
   - Similar to Vercel
   - Form handling, serverless functions

3. **AWS S3 + CloudFront**
   - Static hosting on S3
   - CDN via CloudFront
   - Custom domain with Route 53

**Configuration:**
```javascript
// Update API base URL for production:
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://api.your-domain.com/api'
});
```

### Monitoring & Logging

#### Backend Monitoring
- **Error Tracking**: Sentry, Rollbar
- **Performance**: New Relic, DataDog
- **Uptime**: UptimeRobot, Pingdom

#### Database Monitoring
- MongoDB Atlas built-in monitoring
- Query performance insights
- Index usage analysis

#### Email Monitoring
- **Gmail API**: Monitor quota usage in Google Cloud Console
- **Production Limits**: 2,000 emails/day (Gmail), 10,000/day (Workspace)
- **Analytics**: Open rates, click rates from MailLog collection
- **Deliverability**: Ensure SPF, DKIM, DMARC configured for custom domain
- **OAuth Token Management**: Refresh tokens are long-lived but monitor for expiration
- **Fallback Strategy**: SMTP via SendGrid/AWS SES if Gmail API unavailable

### Scaling Strategies

#### Horizontal Scaling
```
Load Balancer
    ├── API Server 1
    ├── API Server 2
    └── API Server 3
         ↓
    MongoDB Replica Set
```

#### Caching Layer
- **Redis**: Session storage, rate limiting
- **CDN**: Static assets, images

#### Queue System
- **Bull/BullMQ**: Background job processing
- **Use Case**: Bulk email sending, scheduled emails

---

## Performance Optimization

### Backend Optimizations

1. **Database Indexing**
   - Compound indexes on frequently queried fields
   - Sparse indexes for optional unique fields
   - Regular index performance analysis

2. **Query Optimization**
   - Use `.lean()` for read-only queries
   - Select only required fields
   - Pagination for large result sets
   - Aggregation pipelines for analytics

3. **Caching**
   - In-memory caching for frequently accessed data
   - Redis for distributed caching

### Frontend Optimizations

1. **Code Splitting**
   - Route-based code splitting
   - Lazy loading for heavy components

2. **Bundle Optimization**
   - Tree shaking (automatic with Vite)
   - Minification in production
   - Compression (gzip/brotli)

3. **Asset Optimization**
   - Image compression
   - Lazy loading images
   - CDN for static assets

---

## Security Checklist

### Pre-Production Security Audit

- [ ] All secrets moved to environment variables
- [ ] Strong JWT secret (>= 256 bits)
- [ ] HTTPS enforced in production
- [ ] CORS restricted to production domain
- [ ] Rate limiting implemented on auth endpoints
- [ ] SQL injection prevention (NoSQL injection for MongoDB)
- [ ] XSS prevention (React default escaping)
- [ ] CSRF tokens for state-changing operations
- [ ] Password complexity requirements
- [ ] Email verification enforced
- [ ] Sensitive data encrypted at rest
- [ ] Audit logging for critical operations
- [ ] Regular dependency updates (npm audit)
- [ ] Security headers (Helmet.js)
- [ ] Input validation on all endpoints

---

## Future Enhancements

### Implemented Features ✅

1. **Gmail OAuth2 Integration**
   - ✅ OAuth consent flow
   - ✅ Gmail API draft creation
   - ✅ Gmail API direct sending
   - ✅ Refresh token management
   - ✅ Dual-path email sending (Gmail API + SMTP fallback)

### Planned Features

1. **Email Templates**
   - Visual email builder
   - Template library
   - Variable substitution
   - Dynamic content personalization

2. **Advanced Scheduling**
   - Time zone support
   - Recurring campaigns
   - A/B testing
   - Optimal send time prediction

3. **Enhanced Analytics**
   - Heatmaps for email clicks
   - Engagement scoring
   - Predictive analytics
   - Campaign performance comparison

4. **Integration APIs**
   - Zapier integration
   - Webhook support
   - REST API documentation (Swagger/OpenAPI)
   - GraphQL API endpoint

5. **Team Collaboration**
   - Multi-user workspaces
   - Role-based access control
   - Activity audit logs
   - Shared draft folders

6. **Mobile App**
   - React Native mobile client
   - Push notifications
   - Offline support
   - Mobile-optimized analytics

7. **Advanced Gmail Features**
   - Gmail label management
   - Thread conversation tracking
   - Scheduled send via Gmail API
   - Email signature templates
   - Attachment support for drafts

---

## Appendix

### Useful Commands

```bash
# Backend:
npm run dev              # Start dev server with nodemon
npm start                # Start production server
node test-draft.js       # Run draft tests
node test-mail.js        # Run mail tests
node backend/scripts/testCreateDraft.js  # Test Gmail draft creation

# Frontend:
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Gmail OAuth Setup:
# 1. Visit: http://localhost:5000/api/auth/google/url
# 2. Copy URL and authorize in browser
# 3. Extract refresh_token from callback response
# 4. Update GOOGLE_REFRESH_TOKEN in .env

# Git:
git status               # Check file changes
git add .                # Stage all changes
git commit -m "message"  # Commit with message
git push origin main     # Push to remote

# Database:
mongosh "mongodb+srv://..."  # Connect to MongoDB
use telegraph                # Switch to database
db.users.find()              # Query users
```

### Environment Setup Checklist

- [ ] Node.js >= 18 installed
- [ ] MongoDB Atlas account created
- [ ] Database connection string obtained
- [ ] Google Cloud Console project created
- [ ] Gmail API enabled in Cloud Console
- [ ] OAuth2 credentials created (Client ID & Secret)
- [ ] Authorized redirect URI configured
- [ ] .env files configured (backend)
- [ ] Gmail refresh token obtained via OAuth flow
- [ ] Dependencies installed (npm install)
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 3000)
- [ ] Test user registered
- [ ] Sample data created
- [ ] Test email sent successfully

### Troubleshooting

**Common Issues:**

1. **MongoDB Connection Failed**
   - Check MONGODB_URI in .env
   - Verify IP whitelist in Atlas
   - Ensure correct database name

2. **CORS Errors**
   - Verify CLIENT_URL in backend .env
   - Check Vite proxy configuration
   - Ensure credentials: true in CORS config

3. **Authentication Fails**
   - Check JWT_SECRET consistency
   - Verify token format (Bearer <token>)
   - Check token expiry

4. **Email Sending Fails (SMTP)**
   - Verify SMTP credentials in .env
   - Check Ethereal account status
   - Review emailService.js initialization
   - Enable USE_GMAIL_OAUTH for production

5. **Gmail OAuth Errors**
   - **"Invalid login: 535-5.7.8"**: SMTP verification failed (expected with OAuth, doesn't affect Gmail API)
   - **"Request had insufficient authentication scopes"**: Refresh token missing required scopes, re-consent needed
   - **"invalid_grant"**: Refresh token expired or revoked, obtain new token via /api/auth/google/url
   - **"redirect_uri_mismatch"**: Ensure redirect URI in code matches Google Cloud Console exactly
   - **Missing refresh_token in callback**: Must use access_type='offline' and prompt='consent'

6. **Gmail API Quota Exceeded**
   - Standard Gmail: 2,000 emails/day limit
   - Google Workspace: 10,000 emails/day limit
   - Check quota usage in Google Cloud Console
   - Implement exponential backoff retry logic

7. **Draft Not Visible in Gmail**
   - Verify GOOGLE_REFRESH_TOKEN is set correctly
   - Check OAuth scopes include 'gmail.compose'
   - Ensure using correct Gmail account
   - Check server logs for API errors

---

**Document Version:** 1.0.0  
**Last Updated:** November 12, 2025  
**Maintained By:** Telegraph Development Team  
**Contact:** [GitHub Repository](https://github.com/rop2024/telegramph)
