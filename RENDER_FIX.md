# Render Backend - Troubleshooting & Fix

## Issue: "Exited with status 1 while running your code"

This error typically means:
1. ❌ Root directory not specified
2. ❌ Missing environment variables
3. ❌ Module loading error
4. ❌ Port binding issue

---

## QUICK FIX ✅

### Option 1: Manual Deployment (Recommended)
1. Go to Render Dashboard: https://dashboard.render.com
2. Select your service: `svga-book-bank-api`
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait for logs to appear

### Option 2: Fix via Dashboard Settings
1. Go to Service Settings
2. Verify these settings:
   ```
   Build Command: npm ci --omit=dev
   Start Command: npm start
   ```
3. In **Environment** tab, add these variables:
   ```
   NODE_ENV = production
   PORT = 3004
   MONGODB_URI = mongodb+srv://shahdevu236_db_user:Devansh236@cluster0.s3lvo9w.mongodb.net/?appName=Cluster0
   JWT_SECRET = svga_book_bank_jwt_secret_2024
   MSG91_API_KEY = 360149ASlGKrTE3y60923defP1
   MSG91_TEMPLATE_ID = 60990d5f895ca529bd69e429
   MSG91_COUNTRY_CODE = 91
   CORS_ORIGIN = https://your-vercel-url.vercel.app
   ```

4. Click "Deploy"

### Option 3: Redeploy from GitHub
1. Go to your service
2. Click **"Manual Deploy"** dropdown
3. Select **"Deploy latest commit"**

---

## Verify Deployment Success
Once deployed, test your API:
```
https://svga-book-bank-api.onrender.com/api/health
```

You should see:
```json
{
  "status": "ok",
  "service": "SVGA Book Bank API",
  "madeBy": "Devansh Nisar"
}
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Build fails | Check all env vars are set, redeploy |
| Can't connect to MongoDB | Verify `MONGODB_URI` is correct, check IP whitelist on Atlas |
| CORS errors | Ensure `CORS_ORIGIN` matches your Vercel URL |
| Port already in use | Change `PORT` to different value |

---

## After Frontend is Live
Update your Render backend with actual Vercel URL:
1. Service Settings → Environment
2. Change `CORS_ORIGIN` to: `https://<your-actual-vercel-domain>.vercel.app`
3. Redeploy

**Your backend URL will be something like:**
```
https://svga-book-bank-api.onrender.com
```

Copy this for your frontend configuration!
