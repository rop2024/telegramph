# Project Architecture: Telegraph

## Overview
Telegraph is a full-stack web application with a React frontend and Express.js backend, using MongoDB for data storage and Firebase for authentication.

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
  - **Security**: Email encrypted in database
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

### Draft Management Endpoints (`/api/drafts`)
- `GET /api/drafts/templates` - Get all available email templates
  - **Access**: Private (JWT required)
  - **Response**: `{ success: true, data: { templates: [templateObjects] } }`

- `GET /api/drafts/templates/:id` - Get specific template by ID
  - **Access**: Private (JWT required)
  - **Response**: `{ success: true, data: { template } }`

- `POST /api/drafts` - Create a new draft
  - **Access**: Private (JWT required)
  - **Body**: `{ title, subject, body, receivers?, template?, tags? }`
  - **Validation**: Required title/subject/body, optional arrays
  - **Security**: Verifies receiver ownership
  - **Response**: `{ success: true, data: { draft } }`

- `GET /api/drafts` - Get all drafts for current user
  - **Access**: Private (JWT required)
  - **Query Params**: `page, limit, status, category, search, sortBy, sortOrder`
  - **Features**: Filter by status/category, search, pagination, sorting
  - **Response**: `{ success: true, data: { drafts, pagination } }`

- `GET /api/drafts/stats` - Get draft statistics
  - **Access**: Private (JWT required)
  - **Response**: `{ success: true, data: { totalDrafts, draftsByStatus, draftsByCategory, recentDrafts } }`

- `GET /api/drafts/:id` - Get single draft by ID
  - **Access**: Private (JWT required, ownership verified)
  - **Response**: `{ success: true, data: { draft } }`

- `PUT /api/drafts/:id` - Update a draft
  - **Access**: Private (JWT required, ownership verified)
  - **Body**: `{ title, subject, body, receivers?, template?, tags? }`
  - **Security**: Verifies receiver ownership
  - **Response**: `{ success: true, data: { draft } }`

- `DELETE /api/drafts/:id` - Delete a draft
  - **Access**: Private (JWT required, ownership verified)
  - **Response**: `{ success: true, message: "Draft deleted successfully" }`

- `POST /api/drafts/:id/duplicate` - Duplicate a draft
  - **Access**: Private (JWT required, ownership verified)
  - **Response**: `{ success: true, data: { draft } }`

## Frontend Routes

### Base URL: `http://localhost:3000`

- `/` - Redirects to `/dashboard`
- `/login` - User login page
- `/register` - User registration page
- `/dashboard` - Main dashboard (requires authentication)

## Database Models

### User Model
- `username` (String, required, unique)
- `email` (String, required, unique)
- `password` (String, required, hashed)
- `role` (String, default: 'user')
- `createdAt` (Date)
- `updatedAt` (Date)

### Receiver Model
- `userId` (ObjectId, reference to User)
- `name` (String, required)
- `email` (String, required, encrypted)
- `phone` (String, optional)
- `company` (String, optional)
- `department` (String, optional)
- `tags` (Array of Strings)
- `notes` (String, optional)
- `createdAt` (Date)
- `updatedAt` (Date)

### Test Model
- `message` (String)
- `timestamp` (Date, default: now)

### Draft Model
- `userId` (ObjectId, reference to User)
- `title` (String, required)
- `subject` (String, required)
- `body` (String, required)
- `receivers` (Array of ObjectIds, references to Receiver)
- `template` (Object: `{ name, category }`)
- `tags` (Array of Strings)
- `status` (String: 'draft', 'scheduled', 'sent', default: 'draft')
- `draftId` (Number, auto-incremented)
- `createdAt` (Date)
- `lastEdited` (Date)

## Authentication Flow
1. User registers via `POST /auth/register`
2. User logs in via `POST /auth/login` (receives JWT token)
3. Frontend stores token in localStorage
4. Subsequent requests include token in Authorization header
5. Protected routes verify token via `authMiddleware`

## Data Flow
1. Frontend makes API calls to backend endpoints
2. Backend validates requests and interacts with MongoDB
3. Sensitive data (emails) are encrypted in database
4. Responses include decrypted data for frontend display

## Security Features
- JWT token-based authentication
- Password hashing with bcrypt
- Email encryption for receivers
- Input validation and sanitization
- CORS configuration
- Role-based access control

## Environment Variables
### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `FIREBASE_SERVICE_ACCOUNT` - Path to Firebase service account JSON

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API base URL (default: http://localhost:5000)

## Technologies Used
- **Frontend**: React, React Router, Axios, CSS
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT, Firebase Admin
- **Security**: bcrypt, crypto (for email encryption)
- **Validation**: express-validator
- **Development**: Create React App, nodemon</content>
<parameter name="filePath">d:\@Development\_1_projects\@project - telegraph\architecture.md