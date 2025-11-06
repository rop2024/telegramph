# Project Architecture: Telegraph

## Overview
Telegraph is a comprehensive email management system built as a full-stack web application with a React frontend and Express.js backend. It provides secure email draft management, receiver management with encrypted storage, and email sending capabilities with template personalization.

## Backend API Endpoints

### Base URL: `http://localhost:5000`

### Health & Test Endpoints
- `GET /health` - Server health check
  - **Response**: `{ status: "Server is running!", timestamp: "ISO_DATE" }`

- `GET /test` - Basic backend test
  - **Response**: `{ message: "Backend is working!" }`

- `POST /test-db` - Test MongoDB connection (saves a test document)
  - **Response**: `{ success: true, message: "MongoDB connection working!", data: testDoc }`

- `GET /test-db` - Get all test documents
  - **Response**: `{ success: true, data: [testDocuments] }`

### Authentication Endpoints (`/auth`)
- `POST /auth/register` - Register a new user
  - **Access**: Public
  - **Body**: `{ username, email, password }`
  - **Validation**: Username (3-30 chars, alphanumeric + underscore), valid email, password (min 6 chars)
  - **Response**: `{ success: true, data: { user, token } }`

- `POST /auth/login` - Login user
  - **Access**: Public
  - **Body**: `{ email, password }`
  - **Response**: `{ success: true, data: { user, token } }`

- `GET /auth/me` - Get current user profile
  - **Access**: Private (JWT required)
  - **Response**: `{ success: true, data: { user } }`

### Protected Endpoints (`/protected`)
- `GET /protected/test` - Test protected route
  - **Access**: Private (JWT required)
  - **Response**: `{ success: true, message: "Access granted", user, timestamp }`

- `GET /protected/admin-test` - Test admin-only route
  - **Access**: Private (Admin role required)
  - **Response**: `{ success: true, message: "Welcome, Admin!", user, timestamp }`

### Receiver Management Endpoints (`/receivers`)
- `POST /receivers` - Add a new receiver
  - **Access**: Private (JWT required)
  - **Body**: `{ name, email, phone?, company?, department?, tags?, notes? }`
  - **Validation**: Required name/email, optional fields with length limits
  - **Security**: Email encrypted in database using AES-256
  - **Response**: `{ success: true, data: { receiver } }`

- `GET /receivers` - Get all receivers for current user with pagination/search
  - **Access**: Private (JWT required)
  - **Query Params**: `page, limit, search, sortBy, sortOrder`
  - **Features**: Search by name/company/department/tags, pagination, sorting
  - **Security**: Emails decrypted for response
  - **Response**: `{ success: true, data: { receivers, pagination } }`

- `GET /receivers/:id` - Get single receiver by ID
  - **Access**: Private (JWT required, ownership verified)
  - **Security**: Email decrypted for response
  - **Response**: `{ success: true, data: { receiver } }`

- `PUT /receivers/:id` - Update a receiver
  - **Access**: Private (JWT required, ownership verified)
  - **Body**: `{ name, email, phone?, company?, department?, tags?, notes? }`
  - **Security**: Email encrypted on save
  - **Response**: `{ success: true, data: { receiver } }`

- `DELETE /receivers/:id` - Delete a receiver
  - **Access**: Private (JWT required, ownership verified)
  - **Response**: `{ success: true, message: "Receiver deleted successfully" }`

- `GET /receivers/stats/count` - Get receiver statistics
  - **Access**: Private (JWT required)
  - **Response**: `{ success: true, data: { total, recent } }`

### Draft Management Endpoints (`/drafts`)
- `GET /drafts/templates` - Get all available email templates
  - **Access**: Private (JWT required)
  - **Response**: `{ success: true, data: { templates: [templateObjects] } }`

- `GET /drafts/templates/:id` - Get specific template by ID
  - **Access**: Private (JWT required)
  - **Response**: `{ success: true, data: { template } }`

- `POST /drafts` - Create a new draft
  - **Access**: Private (JWT required)
  - **Body**: `{ title, subject, body, receivers?, template?, tags? }`
  - **Validation**: Required title/subject/body, optional arrays
  - **Security**: Verifies receiver ownership
  - **Response**: `{ success: true, data: { draft } }`

- `GET /drafts` - Get all drafts for current user
  - **Access**: Private (JWT required)
  - **Query Params**: `page, limit, status, category, search, sortBy, sortOrder`
  - **Features**: Filter by status/category, search, pagination, sorting
  - **Response**: `{ success: true, data: { drafts, pagination } }`

- `GET /drafts/stats` - Get draft statistics
  - **Access**: Private (JWT required)
  - **Response**: `{ success: true, data: { totalDrafts, draftsByStatus, draftsByCategory, recentDrafts } }`

- `GET /drafts/:id` - Get single draft by ID
  - **Access**: Private (JWT required, ownership verified)
  - **Response**: `{ success: true, data: { draft } }`

- `PUT /drafts/:id` - Update a draft
  - **Access**: Private (JWT required, ownership verified)
  - **Body**: `{ title, subject, body, receivers?, template?, tags? }`
  - **Security**: Verifies receiver ownership
  - **Response**: `{ success: true, data: { draft } }`

- `DELETE /drafts/:id` - Delete a draft
  - **Access**: Private (JWT required, ownership verified)
  - **Response**: `{ success: true, message: "Draft deleted successfully" }`

- `POST /drafts/:id/duplicate` - Duplicate a draft
  - **Access**: Private (JWT required, ownership verified)
  - **Response**: `{ success: true, data: { draft } }`

### Email Sending Endpoints (`/api/mail`)
- `POST /api/mail/send` - Send email to selected receivers
  - **Access**: Private (JWT required)
  - **Body**: `{ draftId, receiverIds[] }`
  - **Validation**: Valid draft ID, array of receiver IDs (min 1)
  - **Security**: Verifies draft and receiver ownership
  - **Features**: Creates mail logs, personalized content, async sending
  - **Response**: `{ success: true, message, data: { total, sent, failed, draftId } }`

- `POST /api/mail/send-test` - Send test email to yourself
  - **Access**: Private (JWT required)
  - **Body**: `{ draftId }`
  - **Features**: Sends to user's own email with [TEST] prefix
  - **Response**: `{ success: true, message, data: { messageId } }`

- `GET /api/mail/logs` - Get email sending logs for user
  - **Access**: Private (JWT required)
  - **Query Params**: `page, limit, draftId?, status?, search?, sortBy?, sortOrder?`
  - **Features**: Filter by draft/status, search by recipient/email/subject, pagination
  - **Response**: `{ success: true, data: { logs, pagination } }`

- `GET /api/mail/stats` - Get email sending statistics
  - **Access**: Private (JWT required)
  - **Response**: `{ success: true, data: { sent, failed, pending, sending, total } }`

- `GET /api/mail/draft/:draftId/stats` - Get sending statistics for specific draft
  - **Access**: Private (JWT required)
  - **Response**: `{ success: true, data: { sent, failed, pending, sending, total } }`

## Frontend Routes

### Base URL: `http://localhost:3000`

- `/` - Redirects to `/dashboard`
- `/login` - User login page
- `/register` - User registration page
- `/dashboard` - Main dashboard (requires authentication)
  - **Components**: DraftManager, ReceiverManager, Dashboard navigation
  - **Features**: Overview stats, quick actions, navigation tabs

## Database Models

### User Model
- `username` (String, required, unique)
- `email` (String, required, unique)
- `password` (String, required, hashed with bcrypt)
- `role` (String, default: 'user', enum: ['user', 'admin'])
- `createdAt` (Date)
- `updatedAt` (Date)

### Receiver Model
- `userId` (ObjectId, reference to User, required)
- `name` (String, required)
- `email` (String, required, encrypted with AES-256)
- `phone` (String, optional)
- `company` (String, optional)
- `department` (String, optional)
- `tags` (Array of Strings)
- `notes` (String, optional)
- `createdAt` (Date)
- `updatedAt` (Date)

### Draft Model
- `userId` (ObjectId, reference to User, required)
- `title` (String, required)
- `subject` (String, required)
- `body` (String, required, HTML content)
- `receivers` (Array of ObjectIds, references to Receiver)
- `template` (Object: `{ name, category }`)
- `tags` (Array of Strings)
- `status` (String: 'draft', 'scheduled', 'sent', default: 'draft')
- `draftId` (Number, auto-incremented)
- `createdAt` (Date)
- `lastEdited` (Date)

### MailLog Model
- `userId` (ObjectId, reference to User, required)
- `draftId` (ObjectId, reference to Draft, required)
- `receiverId` (ObjectId, reference to Receiver, required)
- `receiverEmail` (String, required)
- `receiverName` (String, required)
- `subject` (String, required)
- `status` (String: 'pending', 'sending', 'sent', 'failed', default: 'pending')
- `messageId` (String, nodemailer message ID)
- `error` (String, error message if failed)
- `sentAt` (Date)
- `retryCount` (Number, default: 0)
- `lastRetryAt` (Date)
- `metadata` (Object: `{ templateUsed, characterCount, hasAttachments }`)
- `createdAt` (Date)
- `updatedAt` (Date)

### Test Model
- `message` (String)
- `timestamp` (Date, default: now)

## Email Service Configuration

### Supported Providers
- **Gmail OAuth2** (Production): Uses OAuth2 authentication
- **SMTP** (Development): Standard SMTP with app passwords

### Configuration Variables
- `GMAIL_USER` - Gmail account email
- `GMAIL_CLIENT_ID` - OAuth2 client ID
- `GMAIL_CLIENT_SECRET` - OAuth2 client secret
- `GMAIL_REFRESH_TOKEN` - OAuth2 refresh token
- `SMTP_HOST` - SMTP server host (default: smtp.gmail.com)
- `SMTP_PORT` - SMTP server port (default: 587)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password/app password

## Template System

### Template Variables
- `{{recipientName}}` - Receiver's full name
- `{{recipientEmail}}` - Receiver's email address
- `{{company}}` - Receiver's company (fallback: 'Our Company')
- `{{department}}` - Receiver's department
- `{{senderName}}` - Sender's username
- `{{senderEmail}}` - Sender's email
- `{{currentDate}}` - Current date (formatted)
- `{{currentYear}}` - Current year

### Template Categories
- `business` - Professional business communications
- `newsletter` - Newsletter and announcements
- `promotional` - Marketing and promotional content
- `personal` - Personal communications
- `notification` - System notifications and alerts

## Authentication Flow
1. User registers via `POST /auth/register`
2. User logs in via `POST /auth/login` (receives JWT token)
3. Frontend stores token in localStorage
4. Subsequent requests include token in Authorization header
5. Protected routes verify token via `authMiddleware`

## Email Sending Flow
1. User creates draft via `POST /drafts`
2. User selects receivers and clicks send
3. Frontend calls `POST /api/mail/send` with draftId and receiverIds
4. Backend validates ownership and creates MailLog entries
5. TemplateParser generates personalized content for each receiver
6. EmailService sends emails asynchronously
7. MailLog entries updated with success/failure status
8. Frontend receives completion status

## Data Flow
1. Frontend makes API calls to backend endpoints
2. Backend validates requests and interacts with MongoDB
3. Sensitive data (emails) are encrypted in database using AES-256
4. Email templates are parsed with personalization variables
5. Responses include decrypted data for frontend display
6. Email sending creates audit trail in MailLog collection

## Security Features
- JWT token-based authentication with expiration
- Password hashing with bcrypt (salt rounds: 12)
- Email encryption for receivers using AES-256
- Input validation and sanitization with express-validator
- CORS configuration with specific origins
- Role-based access control (user/admin)
- Ownership verification for all resources
- Request logging middleware

## Environment Variables
### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `FIREBASE_SERVICE_ACCOUNT` - Path to Firebase service account JSON
- `NODE_ENV` - Environment (development/production)

### Email Configuration (.env)
- `GMAIL_USER` - Gmail account for OAuth2
- `GMAIL_CLIENT_ID` - Gmail OAuth2 client ID
- `GMAIL_CLIENT_SECRET` - Gmail OAuth2 client secret
- `GMAIL_REFRESH_TOKEN` - Gmail OAuth2 refresh token
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password/app password

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API base URL (default: http://localhost:5000)

## Technologies Used
- **Frontend**: React 19.2.0, React Router, Axios, CSS Modules
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT, Firebase Admin SDK
- **Email Service**: Nodemailer, Google APIs (OAuth2)
- **Security**: bcrypt, crypto (AES-256), express-validator
- **Validation**: express-validator with custom rules
- **Development**: Create React App, nodemon, concurrently
- **Database**: MongoDB with indexing for performance
- **Template Engine**: Custom template parser with variable substitution</content>
<parameter name="filePath">d:\@Development\_1_projects\@project - telegraph\architecture.md