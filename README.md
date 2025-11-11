# Telegraph - Email Campaign Management System

A modern, full-stack email campaign management system built with React and Node.js, featuring advanced email encryption, template management, and campaign analytics.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (user, admin)
  - Email verification system
  - Password reset functionality
  - Secure token management

- **Receiver Management**
  - AES-256-GCM email encryption for privacy
  - Bulk import/export receivers
  - Advanced filtering and search
  - Tag-based organization
  - Company and department categorization
  - Custom fields support

- **Draft Management**
  - Create and manage email drafts
  - Template system with personalization
  - Receiver selection and grouping
  - Draft statistics and tracking
  - Duplicate draft functionality

- **Email Sending**
  - Gmail OAuth2 integration
  - SMTP fallback support
  - Template variable parsing
  - Personalized bulk email sending
  - Send tracking and logging
  - Test email functionality

- **Analytics & Reporting**
  - Email send statistics
  - Receiver analytics (tags, companies)
  - Draft performance metrics
  - Mail log history

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 19.2.0
- React Router for navigation
- Axios for API calls
- CSS3 for styling

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose ODM
- JWT for authentication
- bcryptjs for password hashing
- nodemailer for email delivery
- AES-256-GCM encryption for sensitive data

**Security:**
- JWT token-based authentication
- AES-256-GCM encryption for receiver emails
- Password hashing with bcrypt
- Email verification tokens
- Password reset tokens with expiry
- Secure HTTP-only practices

## 📁 Project Structure

```
telegraph/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   └── auth.js                # Authentication middleware
│   ├── models/
│   │   ├── User.js                # User model with JWT methods
│   │   ├── Receiver.js            # Receiver model with encryption
│   │   ├── Draft.js               # Draft/campaign model
│   │   └── MailLog.js             # Email send log model
│   ├── routes/
│   │   ├── authRoutes.js          # Auth endpoints
│   │   ├── receiverRoutes.js      # Receiver CRUD endpoints
│   │   ├── draftRoutes.js         # Draft management endpoints
│   │   └── mailRoutes.js          # Email sending endpoints
│   ├── utils/
│   │   └── crypto.js              # Encryption utilities
│   ├── server.js                  # Express app setup
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── .gitignore
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Gmail account (for email sending) or SMTP server
- Git

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rop2024/telegramph.git
   cd telegraph
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Create environment file:**
   Create a `.env` file in the `backend/` directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000

   # Database
   MONGODB_URI=mongodb://localhost:27017/telegraph_dev

   # JWT Secret (generate a strong random string)
   JWT_SECRET=your_super_secret_jwt_key_here_change_this
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30

   # Gmail OAuth2 (optional - for email sending)
   GMAIL_USER=your-email@gmail.com
   GMAIL_CLIENT_ID=your_google_client_id
   GMAIL_CLIENT_SECRET=your_google_client_secret
   GMAIL_REFRESH_TOKEN=your_google_refresh_token

   # SMTP Fallback (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

4. **Start MongoDB:**
   ```bash
   # Windows
   mongod

   # macOS/Linux
   sudo systemctl start mongod
   ```

5. **Run the backend server:**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

   Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Create environment file:**
   Create a `.env` file in the `frontend/` directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

3. **Run the frontend:**
   ```bash
   # Development mode
   npm start

   # Production build
   npm run build
   ```

   Frontend will run on `http://localhost:3000`

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgotpassword` - Request password reset
- `PUT /api/auth/resetpassword/:token` - Reset password
- `POST /api/auth/logout` - Logout user

### Receivers (`/api/receivers`)
- `GET /api/receivers` - Get all receivers (with pagination, search, filters)
- `GET /api/receivers/:id` - Get single receiver
- `POST /api/receivers` - Create new receiver
- `PUT /api/receivers/:id` - Update receiver
- `DELETE /api/receivers/:id` - Delete receiver
- `POST /api/receivers/bulk/create` - Bulk create receivers
- `DELETE /api/receivers/bulk/delete` - Bulk delete receivers
- `GET /api/receivers/stats/summary` - Get receiver statistics

### Drafts (`/drafts`)
- `GET /drafts` - Get all drafts
- `GET /drafts/:id` - Get single draft
- `POST /drafts` - Create new draft
- `PUT /drafts/:id` - Update draft
- `DELETE /drafts/:id` - Delete draft
- `POST /drafts/:id/duplicate` - Duplicate draft
- `GET /drafts/templates` - Get email templates
- `GET /drafts/stats` - Get draft statistics

### Mail (`/api/mail`)
- `POST /api/mail/send` - Send email campaign
- `POST /api/mail/send-test` - Send test email
- `GET /api/mail/logs` - Get mail logs
- `GET /api/mail/stats` - Get mail statistics
- `GET /api/mail/draft/:draftId/stats` - Get draft-specific stats

## 🔐 Security Features

### Encryption
- **Receiver emails** are encrypted using AES-256-GCM before storage
- **Decryption** happens only when needed (API responses)
- **JWT tokens** for stateless authentication
- **Password hashing** with bcrypt (10 rounds)

### Token Management
- Email verification tokens (24-hour expiry)
- Password reset tokens (10-minute expiry)
- JWT tokens with configurable expiry
- SHA-256 hashing for token storage

### Best Practices
- Environment variables for sensitive data
- Input validation on all endpoints
- Role-based access control
- Secure HTTP headers
- CORS configuration
- Rate limiting (recommended for production)

## 🚦 Environment Variables

### Backend Required
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)

### Backend Optional (Email)
- `GMAIL_USER`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` - Gmail OAuth2
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - SMTP fallback

### Frontend
- `REACT_APP_API_URL` - Backend API base URL

## 📊 Data Models

### User
- Authentication credentials
- Profile information (name, email, role)
- Email signature and templates
- Verification status
- Token fields for reset/verification

### Receiver
- Contact information (name, email - encrypted)
- Organization details (company, department)
- Tags for categorization
- Custom fields (key-value pairs)
- Active/inactive status

### Draft
- Campaign content (subject, body)
- Template selection
- Receiver list/groups
- Status tracking
- Metadata (created, updated)

### MailLog
- Email send records
- Recipient tracking
- Status (sent, failed, pending)
- Draft association
- Timestamps

## 🧪 Development

### Running Tests
```bash
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Development Scripts
```bash
# Backend with nodemon
npm run dev

# Frontend with hot reload
npm start
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (minimum 32 characters)
- [ ] Configure production MongoDB instance
- [ ] Set up email service credentials
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS for production domain
- [ ] Set up environment variables on hosting platform
- [ ] Build frontend: `npm run build`
- [ ] Use process manager (PM2) for backend
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging

### Deployment Platforms
- **Backend**: Heroku, DigitalOcean, AWS EC2, Railway, Render
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Database**: MongoDB Atlas, AWS DocumentDB

## 📝 License

This project is private and proprietary.

## 👥 Contributors

- Development Team: rop2024

## 📧 Support

For issues, questions, or contributions, please contact the development team.

---

**Last Updated:** November 11, 2025
