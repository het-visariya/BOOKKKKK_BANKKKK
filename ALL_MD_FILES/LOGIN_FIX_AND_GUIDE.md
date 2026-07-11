# SVGA Book Bank - Login Fix & System Overview

## 🔧 FIXES APPLIED

### 1. **Environment Configuration** ✅
Created `.env` files for both server and frontend with proper configuration:

**Server (.env):**
- MongoDB connection: `mongodb://localhost:27017/svga-book-bank`
- Server port: 3001
- JWT secret and token expiry
- Admin credentials: `svga_admin` / `admin123`

**Frontend (.env):**
- API URL: `http://localhost:3001`
- Optional integrations for SMS, Email, WhatsApp

---

## 🚀 SETUP INSTRUCTIONS

### Prerequisites
1. **Node.js & npm/pnpm** installed
2. **MongoDB** running locally or accessible
3. Port **3001** available for backend server

### Step 1: Install MongoDB (if not installed)
```bash
# Windows: Download from https://www.mongodb.com/try/download/community
# Or use Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 2: Start the Backend Server
```bash
cd SVGA_FINALLL_V2/server
npm install  # if not already installed
npm run dev  # starts on port 3001
```

Expected output:
```
[DB] MongoDB connected successfully
[Server] SVGA Book Bank API running on port 3001
[Server] Made by Devansh Nisar
```

### Step 3: Start the Frontend
```bash
cd SVGA_FINALLL_V2/src/frontend
npm install  # if not already installed
npm run dev  # starts on port 5173 (or similar)
```

### Step 4: Access the Application
- **Student Login**: http://localhost:5173/student/login
- **Admin Login**: http://localhost:5173/admin/login
- **Health Check**: http://localhost:3001/api/health

---

## 🔑 LOGIN CREDENTIALS

### Admin Login
- **Username**: `svga_admin`
- **Password**: `admin123`
- **Location**: `/admin/login`

### Student Login (OTP-Based)
The student login uses a two-step process:
1. Enter Aadhaar number (12 digits) and phone (10 digits)
2. Enter OTP (sent via email/SMS - in demo, shown in UI)

**Demo credentials**:
- **Aadhaar**: `123456789012`
- **Phone**: `9876543210`
- **OTP**: Displayed as toast notification during flow

---

## ⚙️ TROUBLESHOOTING LOGIN ISSUES

### Issue 1: "No token provided" or 401 error
**Cause**: API_BASE is not set correctly
**Fix**:
```bash
# Verify frontend .env has:
VITE_API_URL=http://localhost:3001
```

### Issue 2: MongoDB connection error
**Cause**: MongoDB not running
**Fix**:
```bash
# Start MongoDB locally:
mongod

# Or check if running:
netstat -an | find "27017"  # Windows
lsof -i :27017              # Mac/Linux
```

### Issue 3: "Invalid admin credentials"
**Cause**: Credentials don't match .env
**Fix**:
```bash
# Check server/.env for:
ADMIN_USERNAME=svga_admin
ADMIN_PASSWORD=admin123
```

### Issue 4: CORS errors
**Cause**: Frontend and backend not properly configured
**Fix**:
```bash
# Verify in server/.env:
CORS_ORIGIN=*

# And in server/index.js, ensure cors is configured
```

---

## 🏗️ SYSTEM ARCHITECTURE

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Routing**: TanStack Router
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **HTTP**: Fetch API via REST adapter

### Backend Stack
- **Server**: Express.js
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: JWT tokens + Middleware
- **File Uploads**: Multer for PDF/image handling
- **ID Generation**: UUID v4

### System Flow
```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                       │
│  - Student/Admin Login Pages                                 │
│  - Dashboard with Book Management                            │
│  - Profile & Payment Management                              │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST (VITE_API_URL)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                         │
│  - Auth Routes (/api/auth)                                   │
│  - Book Management (/api/books)                              │
│  - Request Handling (/api/requests)                          │
│  - Admin Dashboard (/api/admin)                              │
│  - Student Management (/api/students)                        │
└────────────────────┬────────────────────────────────────────┘
                     │ MongoDB Protocol
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                 DATABASE (MongoDB)                           │
│  - Users Collection (students + admin)                       │
│  - Books Collection                                          │
│  - Requests Collection                                       │
│  - Payments Collection                                       │
│  - Notifications Collection                                  │
│  - Challans Collection (invoices)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 APPLICATION FEATURES

### Student Portal
1. **Registration & OTP Verification**
   - Aadhaar-based identification
   - Phone verification via OTP
   - Profile completion (name, course, college)

2. **Membership Payment**
   - ₹200 membership fee
   - Demo payment integration
   - Payment status tracking

3. **Book Management**
   - Search & browse available books
   - Request books from library
   - Track issued books
   - Return books with QR codes
   - Reserve books

4. **Notifications**
   - Book approval/rejection notifications
   - Book ready for pickup alerts
   - Return reminders
   - Course completion alerts

5. **Personal Dashboard**
   - Issued books with due dates
   - Request history
   - Payment status
   - Profile management

### Admin Portal
1. **Dashboard**
   - Key metrics (total books, students, requests, payments)
   - Pending requests queue
   - Return timeline (sorted by urgency)
   - Analytics & reports

2. **Request Management**
   - View pending book requests
   - Approve/reject individual books
   - Set expected return dates
   - Generate collection orders (challan)
   - Print collection lists

3. **Inventory Management**
   - Add/edit/delete books
   - Track availability
   - Manage procurement requests
   - View transfer history

4. **Student Management**
   - View all students
   - Edit student information
   - Track student activity
   - Manage memberships

5. **Report Generation**
   - Collection PDFs (Challans)
   - QR-coded invoices
   - Analytics reports
   - Audit logs

---

## 📊 DATA MODEL

### User Schema
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  passwordHash: String,
  phone: String,
  aadhaarNumber: String (unique),
  course: String,
  college: String,
  studentId: String (unique),
  role: "student" | "admin",
  membershipStatus: "PAID" | "NOT_PAID",
  paymentStatus: "SUCCESS" | "PENDING" | "FAILED",
  profilePhoto: String (URL),
  issuedBooks: [
    {
      bookId: ObjectId,
      bookTitle: String,
      issueDate: Date,
      returnDate: Date,
      returned: Boolean
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Book Schema
```javascript
{
  _id: ObjectId,
  title: String,
  author: String,
  edition: String,
  publisher: String,
  category: String,
  quantity: Number,
  availableCount: Number,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Request Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  selectedBookIds: [ObjectId],
  requestedBooks: [{ title, author, note }],
  status: "pending" | "approved" | "rejected" | "issued",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Authentication Flow

### Admin Login
```
1. User enters username & password on /admin/login
2. Frontend sends POST /api/auth/admin/login
3. Backend validates against ADMIN_USERNAME & ADMIN_PASSWORD
4. JWT token generated (7-day expiry)
5. Token stored in localStorage
6. Redirected to /admin/dashboard
```

### Student Login (OTP-Based)
```
1. User enters Aadhaar (12 digits) & phone (10 digits)
2. Frontend sends POST /api/auth/otp/send
3. Backend generates 6-digit OTP (demo: returned in response)
4. User receives OTP (email/SMS in production)
5. User enters OTP + optional profile info (if new student)
6. Frontend sends POST /api/auth/otp/verify or /api/auth/register-and-pay
7. Backend verifies OTP and creates/updates user
8. JWT token generated (30-day expiry)
9. Session stored in localStorage
10. Redirected to /student/dashboard or /student/register
```

---

## 🧪 TESTING THE SYSTEM

### Test Admin Login
```bash
curl -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "svga_admin",
    "password": "admin123"
  }'
```

### Test Student OTP Flow
```bash
# Step 1: Send OTP
curl -X POST http://localhost:3001/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaarNumber": "123456789012",
    "phone": "9876543210"
  }'

# Step 2: Verify OTP (response includes OTP in demo mode)
curl -X POST http://localhost:3001/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaarNumber": "123456789012",
    "otp": "123456",
    "phone": "9876543210"
  }'
```

### Test Health Check
```bash
curl http://localhost:3001/api/health
```

---

## 📋 API ENDPOINTS

### Authentication
- `POST /api/auth/register` - Student registration with email/password
- `POST /api/auth/login` - Student login with email/password
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/otp/send` - Send OTP for registration
- `POST /api/auth/otp/verify` - Verify OTP and login
- `POST /api/auth/payment/demo` - Demo payment (₹200 membership)
- `GET /api/auth/current-user` - Get logged-in user info

### Books
- `GET /api/books` - List all books
- `GET /api/books/:id` - Get book details
- `POST /api/books` - Add book (admin only)
- `PUT /api/books/:id` - Edit book (admin only)
- `DELETE /api/books/:id` - Delete book (admin only)

### Requests
- `POST /api/requests` - Create book request
- `GET /api/requests` - Get user's requests
- `GET /api/requests/:id` - Get request details
- `PUT /api/requests/:id` - Update request

### Admin
- `GET /api/admin/pending-requests` - Pending requests
- `GET /api/admin/return-timeline` - Return timeline
- `POST /api/admin/approve-request` - Approve request

---

## 🎨 UI/UX OVERVIEW

### Color Scheme (OKLCH Light Theme)
- **Primary**: Sky Blue (for actions, links, CTA buttons)
- **Background**: Very light blue-tinted white
- **Text**: Deep navy (high contrast)
- **Success**: Green (for availability, approvals)
- **Error**: Red (for warnings, deletions)
- **Muted**: Light gray (for disabled states, placeholders)

### Key Pages
1. **Landing Page** (`/`) - Welcome & navigation to login
2. **Student Login** (`/student/login`) - OTP-based login
3. **Student Register** (`/student/register`) - Membership payment
4. **Student Dashboard** (`/student/dashboard`) - Books, requests, profile
5. **Admin Login** (`/admin/login`) - Admin credentials
6. **Admin Dashboard** (`/admin/dashboard`) - Metrics & queue
7. **Admin Requests** (`/admin/requests`) - Request management
8. **Admin Students** (`/admin/students`) - Student management

---

## 📝 NEXT STEPS

1. ✅ **Database Setup**: Ensure MongoDB is running
2. ✅ **Environment Config**: .env files created
3. 🔄 **Start Server**: `npm run dev` in server directory
4. 🔄 **Start Frontend**: `npm run dev` in frontend directory
5. 🧪 **Test Logins**: Use credentials provided above
6. 📊 **Explore Features**: Navigate through admin & student portals
7. 🚀 **Production**: Update environment variables for production deployment

---

## 🆘 SUPPORT

For issues, check:
1. MongoDB connection status
2. Environment variables (.env files)
3. Server logs in terminal
4. Browser console for frontend errors
5. Network tab in DevTools (check API calls)
6. Firewall/port configuration

**Default Admin**: `svga_admin` / `admin123`
**Demo Student**: `123456789012` (Aadhaar) / `9876543210` (Phone)

