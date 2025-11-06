# Project Architecture: Telegraph

## Overview
Telegraph is a full-stack web application with a React frontend and Express.js backend, using MongoDB for data storage and Firebase for authentication.

## Backend API Endpoints

### Base URL: `http://localhost:5000`

### Health & Test Endpoints
- `GET /health` - Server health check
- `GET /test` - Basic backend test
- `POST /test-db` - Test MongoDB connection (saves a test document)
- `GET /test-db` - Get all test documents

### Authentication Endpoints (`/auth`)
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user profile (requires authentication)

### Protected Endpoints (`/protected`)
- `GET /protected/test` - Test protected route (requires authentication)
- `GET /protected/admin-test` - Test admin-only route (requires admin role)

### Receiver Management Endpoints (`/receivers`)
- `POST /receivers` - Add a new receiver (requires authentication)
- `GET /receivers` - Get all receivers for current user with pagination/search (requires authentication)
- `GET /receivers/:id` - Get single receiver by ID (requires authentication)
- `PUT /receivers/:id` - Update a receiver (requires authentication)
- `DELETE /receivers/:id` - Delete a receiver (requires authentication)
- `GET /receivers/stats/count` - Get receiver statistics (total and recent) (requires authentication)

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