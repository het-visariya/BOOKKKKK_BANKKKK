# Student Login OTP Flow - Visual Guide

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STUDENT LOGIN OTP FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

                              START
                                │
                                ▼
                    ┌───────────────────────┐
                    │  STEP 1: AADHAAR      │
                    │  Verification         │
                    ├───────────────────────┤
                    │  Input: 12 digits     │
                    │  Ex: 123456789012     │
                    └───────────────────────┘
                          ✓ Valid
                                │
                                ▼
                    ┌───────────────────────┐
                    │  STEP 2: EMAIL        │
                    │  Entry                │
                    ├───────────────────────┤
                    │  Input: Email         │
                    │  Ex: user@email.com   │
                    │  🔘 Send OTP          │
                    └───────────────────────┘
                          ✓ OTP Sent
                                │
                                ▼
                    ┌───────────────────────┐
                    │  STEP 3: EMAIL OTP    │
                    │  Verification         │
                    ├───────────────────────┤
                    │  Input: 4 digits      │
                    │  Ex: 1234             │
                    │  🔘 Verify OTP        │
                    └───────────────────────┘
                          ✓ Email Verified
                                │
                                ▼
                    ┌───────────────────────┐
                    │  STEP 4: MOBILE       │
                    │  Entry                │
                    ├───────────────────────┤
                    │  Input: 10 digits     │
                    │  Ex: 9876543210       │
                    │  🔘 Send OTP via SMS  │
                    └───────────────────────┘
                          ✓ OTP Sent
                                │
                                ▼
                    ┌───────────────────────┐
                    │  STEP 5: MOBILE OTP   │
                    │  Verification         │
                    ├───────────────────────┤
                    │  Input: 4 digits      │
                    │  Ex: 5678             │
                    │  🔘 Get Started       │
                    └───────────────────────┘
                          ✓ Mobile Verified
                                │
                                ▼
                    ┌───────────────────────┐
                    │  All Steps Verified   │
                    │  ✅ Aadhaar          │
                    │  ✅ Email            │
                    │  ✅ Mobile           │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Profile Check        │
                    └───────────────────────┘
                                │
                  ┌─────────────┴──────────────┐
                  │                           │
                  ▼                           ▼
         ┌─────────────────┐        ┌─────────────────┐
         │  NEW PROFILE    │        │ EXISTING PROFILE│
         │  Not Found      │        │  Found          │
         └─────────────────┘        └─────────────────┘
                  │                           │
                  ▼                           ▼
         ┌─────────────────┐        ┌─────────────────┐
         │  /student/      │        │  /student/      │
         │  onboarding     │        │  dashboard      │
         └─────────────────┘        └─────────────────┘
                  │                           │
                  └─────────────┬─────────────┘
                                │
                                ▼
                        ✅ LOGIN SUCCESSFUL
```

---

## 📊 Progress Indicator

```
Step 1           Step 2           Step 3
Aadhaar          Email            Mobile

  ⓵  ─────────────  ⓶  ─────────────  ⓷
  
At Step 1: ⓵ (active/blue)   ─────  ②   ─────  ③
At Step 2: ✓ (green)         ────── ⓶   ─────  ③
At Step 3: ✓ (green)         ────── ✓   ─────  ⓷
```

---

## 🔑 Key Features

### ✅ Clear Step Progression
- Each step builds on the previous one
- Visual progress indicator shows current position
- Back button allows navigation to previous steps
- All previous data is preserved

### ✅ 4-Digit OTP Validation
- **Email OTP**: Exactly 4 digits
- **Mobile OTP**: Exactly 4 digits
- Auto-truncation: Extra digits ignored
- Real-time validation feedback

### ✅ Auto-Advance
After successfully sending an OTP:
```
1. User sees: "OTP sent to [email/phone]"
2. Link appears: "Enter OTP →"
3. Click to auto-advance to OTP entry step
4. Or manually return via back button
```

### ✅ Error Handling
Each input has validation and clear error messages:
```
❌ Aadhaar: "Enter a valid 12-digit Aadhaar number"
❌ Email: "Enter a valid email address"
❌ OTP: "Enter the 4-digit OTP"
❌ Mobile: "Enter a valid 10-digit mobile number"
```

### ✅ Attempt Limiting
- Email OTP: Max 3 failed verification attempts
- Mobile OTP: Max 3 failed verification attempts
- After 3 failures: OTP expires and must be resent

### ✅ Session Management
```
localStorage {
  svga_token: "jwt_token_here"
  svga_student_session: {
    token: "jwt_token",
    expiresAt: 1234567890
  }
}
```

---

## 📡 API Flow

### Frontend Requests

#### 1️⃣ Send Email OTP
```http
POST /api/auth/otp/send-email
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (Success):
{
  "success": true,
  "message": "OTP sent to email",
  "demoOtp": "1234"          // Dev only
}

Response (Error):
{
  "success": false,
  "message": "Invalid email format"
}
```

#### 2️⃣ Verify Email OTP
```http
POST /api/auth/otp/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "1234"
}

Response (Success):
{
  "success": true,
  "message": "Email verified successfully",
  "verified": true
}

Response (Error):
{
  "success": false,
  "message": "Invalid OTP" / "OTP has expired"
}
```

#### 3️⃣ Send SMS OTP
```http
POST /api/auth/otp/send
Content-Type: application/json

{
  "phone": "9876543210",
  "aadhaarNumber": "123456789012"
}

Response (Success):
{
  "success": true,
  "message": "OTP sent to your registered mobile number",
  "requestId": "req_id"
}
```

#### 4️⃣ Verify SMS OTP + Login
```http
POST /api/auth/otp/verify
Content-Type: application/json

{
  "aadhaarNumber": "123456789012",
  "phone": "9876543210",
  "otp": "5678",
  "email": "user@example.com",
  "name": "",  // Optional for existing users
  "course": "", // Optional
  "college": ""
}

Response (Success):
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "_id": "user_id",
    "name": "Student Name",
    "email": "user@example.com",
    "phone": "9876543210",
    "aadhaarNumber": "123456789012",
    "course": "FYJC",
    "membershipStatus": "NOT_PAID" | "PAID",
    "paymentStatus": "PENDING" | "SUCCESS",
    "role": "student"
  }
}

Response (Error):
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

## 🧪 Test Data

### Valid Inputs
```
Aadhaar: 123456789012 | 111122223333 | 999988887777
Email: student@example.com | user@college.edu | name@mail.co.in
Phone: 9876543210 | 8765432109 | 7654321098
OTP (Email): 1234 | 5678 | 9012
OTP (Mobile): 3456 | 7890 | 2345
```

### Invalid Inputs
```
Aadhaar: 12345 (too short) | 1234567890123 (too long) | abcd5678e0123
Email: notanemail | user@domain | @nodomain.com
Phone: 123456789 (9 digits) | 12345678901 (11 digits) | abcdefghij
OTP: 123 (3 digits) | 12345 (5 digits) | abcd | ----
```

---

## 🔒 Security Considerations

1. **HTTPS Only**: All OTP endpoints must use HTTPS in production
2. **Rate Limiting**: Implement per-IP rate limits (e.g., 5 requests/minute)
3. **OTP Expiry**: 5 minutes (adjustable via environment variable)
4. **Attempt Limiting**: Max 3 attempts before OTP expires
5. **Secure Storage**: OTPs stored server-side, never in localStorage
6. **JWT Expiry**: Tokens expire after 7 days
7. **CORS**: Configure CORS properly for frontend domain

---

## 🚨 Troubleshooting

### Problem: "OTP is not received"
```
✓ Check spam/junk folder (for email)
✓ Wait 5 seconds (SMS delivery delay)
✓ Verify phone number is correct (+91 prefix shown)
✓ Check browser console for demo OTP
→ If still missing: Click "Resend OTP"
```

### Problem: "Invalid OTP error"
```
✓ Verify OTP is exactly 4 digits
✓ No spaces or special characters
✓ Check if OTP hasn't expired (5 minutes)
✓ Maximum 3 attempts allowed
→ If exceeded: Request new OTP
```

### Problem: "Button is disabled"
```
✓ Check all required fields are filled
✓ OTP must be exactly 4 digits
✓ No other validation errors shown
✓ Try refreshing the page
→ If still stuck: Check browser console for errors
```

### Problem: "After clicking Verify, nothing happens"
```
✓ Check Network tab in DevTools
✓ Verify backend server is running (http://localhost:3001)
✓ Check browser console for error messages
✓ Verify API endpoint URLs are correct
→ If API error: Check backend terminal logs
```

---

## 📞 Demo Mode

In development/demo mode, OTPs are displayed:

```javascript
// In browser console after sending OTP
console.log("Demo OTP: 1234");  // Email OTP
console.log("Demo OTP: 5678");  // Mobile OTP
```

Also visible in backend terminal:
```
[Auth] Email OTP for user@example.com: 1234
[Auth] OTP sent successfully to 919876543210
```

---

## 🎯 Next Steps After Login

### Route: /student/onboarding (New Users)
```
- Complete profile information
- Add profile picture
- Review membership terms
- Make ₹200 payment
- Access book bank features
```

### Route: /student/dashboard (Returning Users)
```
- View available books
- Request books
- View request status
- Access library features
- Manage profile
```

---

**Last Updated**: 2026-06-23  
**Version**: 1.0 - Complete  
**Status**: ✅ Ready for Production Testing
