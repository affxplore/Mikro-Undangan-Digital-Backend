# 🚀 Mikro Undangan - Backend API

## 🎯 Tujuan

Backend API **Mikro Undangan** adalah RESTful API yang robust dan scalable untuk platform undangan digital. Dibangun dengan Node.js dan Express.js, menyediakan layanan lengkap mulai dari autentikasi, manajemen konten, hingga sistem pembayaran dan analytics.

## 📋 Dokumentasi

API Backend ini menyediakan layanan core untuk:
- 🔐 **Authentication & Authorization** dengan JWT dan Google OAuth
- 👥 **User Management** dengan role-based access control
- 🎨 **Template & Project Management** untuk undangan digital
- 📨 **Invitation System** dengan tracking dan analytics
- 💳 **Payment & Subscription** terintegrasi dengan Midtrans
- 📊 **Dashboard Analytics** untuk user dan admin
- 📧 **Email Service** untuk notifikasi dan verifikasi
- 📁 **File Management** untuk upload dan storage

## ⚡ Preview Singkat

### 🏗️ **Arsitektur API**
```
┌─────────────────┐    JWT Auth    ┌──────────────────┐
│   Client App    │◄──────────────►│   Express API    │
│   (Frontend)    │   REST APIs    │   (Backend)      │
└─────────────────┘                └──────────────────┘
                                             │
                                             │ Sequelize ORM
                                             ▼
                                   ┌──────────────────┐
                                   │   PostgreSQL     │
                                   │   Database       │
                                   └──────────────────┘
```

### 🔧 **Core Services**
- **Auth Service**: JWT-based authentication dengan refresh token
- **User Service**: Complete user lifecycle management
- **Template Service**: Digital invitation template management
- **Project Service**: User project dan customization data
- **Invitation Service**: Event invitation dengan RSVP tracking
- **Payment Service**: Transaction processing dengan Midtrans
- **Email Service**: SMTP email delivery dengan Nodemailer
- **File Service**: Multi-format file upload dan storage

### 📊 **Database Models**
- **Users & Roles**: Multi-level user management
- **Templates & Categories**: Content management system
- **Projects & Invitations**: Core business logic
- **Transactions & Subscriptions**: Monetization system
- **Analytics & Logs**: Tracking dan reporting

## 🚀 Cara Install

### Prerequisites
```bash
Node.js 18.0+
PostgreSQL 12+
npm 8.0+ atau yarn 1.22+
Git
SMTP Email Account (untuk email service)
```

### 1. Clone & Setup
```bash
# Clone repository
git clone https://github.com/zakkutsu/mikro-undangan.git
cd mikro-undangan/node-mikro-undangan-be

# Install dependencies
npm install
```

### 2. Database Setup
```bash
# Buat database PostgreSQL
createdb mikro_undangan

# Atau menggunakan psql
psql -U postgres
CREATE DATABASE mikro_undangan;
\q
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env dengan konfigurasi Anda
nano .env
```

#### 📝 **Environment Variables**
```env
# Server Configuration
NODE_ENV=development
PORT=2222

# Database Configuration
DB_NAME=mikro_undangan
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
DB_PORT=5432
DB_DIALECT=postgres

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Midtrans Payment
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 4. Database Migration & Seeding
```bash
# Run migrations and sync models
npm run dev  # Akan auto-sync database

# Run seeder untuk data master
npm run seed

# Force seeder (overwrite existing data)
npm run seed:force
```

### 5. Start Development Server
```bash
# Development mode dengan nodemon
npm run dev

# Production mode
npm start

# Server akan berjalan di http://localhost:2222
```

## 🌐 API Endpoints

### Base URL
```
http://localhost:2222/api/v1
```

### 🔐 **Authentication**
```http
POST   /auth/register           # User registration
POST   /auth/verify-otp         # Email verification
POST   /auth/request-otp        # Request new OTP
POST   /auth/login              # User login
POST   /auth/forgot-password    # Password reset request
POST   /auth/reset-password/:token # Password reset confirm
GET    /auth/refresh-token      # Refresh access token
POST   /auth/logout             # User logout
GET    /auth/google             # Google OAuth login
GET    /auth/google/callback    # Google OAuth callback
```

### 👥 **User Management**
```http
GET    /users                   # List users (Admin only)
POST   /users                   # Create user (Admin only)
GET    /users/:id               # Get user details
PUT    /users/:id               # Update user (Admin only)
PUT    /users/:id/profile       # Update own profile
DELETE /users/:id               # Delete user (Admin only)
PATCH  /users/:id/status        # Toggle user status (Admin only)
```

### 🎨 **Templates**
```http
GET    /templates               # List all templates
GET    /templates/:id           # Get template details
POST   /templates               # Create template (Admin only)
PUT    /templates/:id           # Update template (Admin only)
DELETE /templates/:id           # Delete template (Admin only)
```

### 📝 **Projects & Invitations**
```http
# Projects
GET    /projects                # List user projects
POST   /projects                # Create project
GET    /projects/:id            # Get project details
PUT    /projects/:id            # Update project
DELETE /projects/:id            # Delete project

# Invitations
GET    /invitations             # List user invitations
POST   /invitations             # Create invitation
POST   /invitations/create-full # Create project + invitation
GET    /invitations/:id         # Get invitation details
GET    /invitations/public/:id  # Public invitation view
PUT    /invitations/:id         # Update invitation
DELETE /invitations/:id         # Delete invitation
PATCH  /invitations/:id/activate # Activate invitation
```

### 👥 **Guest Management**
```http
GET    /receive_invs            # List invitation guests
POST   /receive_invs            # Add guest manually
POST   /receive_invs/import/:invitationId # Import guests from Excel
GET    /receive_invs/public/by-code/:code # Get guest by code
PATCH  /receive_invs/public/accept/:code # Accept invitation (RSVP)
PUT    /receive_invs/:id        # Update guest
DELETE /receive_invs/:id        # Delete guest
```

### 💳 **Payment & Subscriptions**
```http
# Payments
GET    /payments                # List payment methods
POST   /payments                # Create payment method (Admin)
PUT    /payments/:id            # Update payment method (Admin)
DELETE /payments/:id            # Delete payment method (Admin)

# Subscriptions
GET    /subscriptions           # List subscription plans
POST   /subscriptions           # Create subscription plan (Admin)
PUT    /subscriptions/:id       # Update subscription plan (Admin)

# Transactions
GET    /transactions            # List transactions
POST   /transactions            # Create transaction
POST   /transactions/create-payment-link # Create Midtrans payment
POST   /transactions/webhook    # Midtrans webhook handler
```

### 📊 **Analytics & Dashboard**
```http
GET    /dashboard               # Auto-detect user role dashboard
GET    /dashboard/admin-stats   # Admin statistics
GET    /dashboard/user-stats    # User statistics
```

## 📁 Isi Backend Structure

```
node-mikro-undangan-be/
├── 📂 config/                  # Configuration files
│   ├── 📄 database.js          # Database connection
│   ├── 📄 jwtConfig.js         # JWT configuration
│   └── 📄 passport-setup.js    # Google OAuth setup
│
├── 📂 controllers/             # Route controllers
│   ├── 📂 auth/                # Authentication controllers
│   ├── 📂 user/                # User management
│   ├── 📂 template/            # Template management
│   ├── 📂 project/             # Project controllers
│   ├── 📂 invitation/          # Invitation logic
│   ├── 📂 payment/             # Payment processing
│   ├── 📂 dashboard/           # Analytics controllers
│   └── 📂 admin/               # Admin operations
│
├── 📂 models/                  # Sequelize models
│   ├── 📄 user.js              # User model
│   ├── 📄 role.js              # Role model
│   ├── 📄 template.js          # Template model
│   ├── 📄 project.js           # Project model
│   ├── 📄 invitation.js        # Invitation model
│   ├── 📄 transaksi.js         # Transaction model
│   └── 📄 ...                  # Other models
│
├── 📂 middlewares/             # Express middlewares
│   ├── 📄 authMiddleware.js    # JWT authentication
│   └── 📄 uploadMiddleware.js  # File upload handling
│
├── 📂 helpers/                 # Utility helpers
│   ├── 📄 emailService.js      # Email service
│   ├── 📄 response.js          # API response formatter
│   └── 📄 validators.js        # Input validation
│
├── 📂 migrations/              # Database migrations
├── 📂 seeders/                 # Database seeders
├── 📂 public/uploads/          # Uploaded files storage
├── 📂 routers/                 # Route definitions
│   └── 📄 routers.js           # Main router file
│
├── 📄 app.js                   # Application entry point
├── 📄 package.json             # Dependencies & scripts
└── 📄 .env.example             # Environment template
```

## 🏷️ Tech Stack Tags

### Core Backend
- 🟢 **Node.js 18+** - JavaScript runtime
- ⚡ **Express.js 5.1** - Web application framework
- 🗃️ **Sequelize 6.37** - SQL ORM untuk PostgreSQL
- 🐘 **PostgreSQL** - Primary database
- 🔐 **JSON Web Token** - Stateless authentication

### Authentication & Security
- 🔒 **Passport.js** - Authentication middleware
- 🛡️ **Bcrypt** - Password hashing
- 🍪 **Cookie Parser** - Cookie handling
- 🌐 **CORS** - Cross-origin resource sharing
- 🔑 **Google OAuth 2.0** - Social login

### File & Communication
- 📁 **Multer** - Multipart form data handling
- 📧 **Nodemailer** - Email service integration
- 📱 **WhatsApp API** (planned) - Message integration
- 🖼️ **Image Processing** - File optimization

### Payment & Integration
- 💳 **Midtrans** - Payment gateway integration
- 📊 **Analytics** - Custom analytics system
- 🔄 **Webhook** - Real-time payment notifications
- 💰 **Subscription Management** - Recurring payments

### Development Tools
- 🔄 **Nodemon** - Development auto-reload
- 🗄️ **Sequelize CLI** - Database migrations
- 🐳 **Docker** - Containerization support
- 📝 **ESLint** - Code linting

## 🎬 Demo

### 🌐 API Demo
- **Production API**: [https://api.mikroundangan.com](https://api.mikroundangan.com)
- **Staging API**: [https://staging-api.mikroundangan.com](https://staging-api.mikroundangan.com)
- **API Documentation**: [https://docs.mikroundangan.com/api](https://docs.mikroundangan.com/api)

### 🧪 **Test Endpoints**
```bash
# Health check
curl http://localhost:2222/

# API version info
curl http://localhost:2222/api/v1

# Login test
curl -X POST http://localhost:2222/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### 📊 **Sample Response**
```json
{
  "meta": {
    "status": "success",
    "message": "Login berhasil"
  },
  "data": {
    "user": {
      "id": 1,
      "full_name": "Admin User",
      "email": "admin@example.com",
      "role": {
        "name": "Admin"
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "1h"
  }
}
```

---

**Backend Mikro Undangan** - Powerful API untuk ecosystem undangan digital yang scalable dan modern! 🚀⚡