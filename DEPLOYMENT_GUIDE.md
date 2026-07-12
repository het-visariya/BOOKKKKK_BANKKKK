# SVGA Book Bank - Deployment Guide

## Deployment Overview
- **Backend:** Render (Node.js/Express)
- **Frontend:** Vercel (React/Vite)
- **Database:** MongoDB Atlas (Already configured)

---

## PART 1: BACKEND DEPLOYMENT ON RENDER

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account
3. Connect your GitHub repository

### Step 2: Deploy Backend Service
1. Go to Dashboard → New+ → Web Service
2. Select your BOOKKKKK_BANKKKK repository
3. Configure:
   - **Name:** svga-book-bank-api
   - **Environment:** Node
   - **Build Command:** `npm ci --omit=dev`
   - **Start Command:** `npm start`
   - **Root Directory:** `server`

### Step 3: Set Environment Variables
Add these variables in Render Dashboard → Environment:
```
MONGODB_URI=<your-atlas-connection-string>
JWT_SECRET=svga_book_bank_jwt_secret_2024
MSG91_API_KEY=<your-msg91-key>
MSG91_TEMPLATE_ID=<your-template-id>
MSG91_COUNTRY_CODE=91
EMAIL_USER=<your-email>
EMAIL_PASSWORD=<your-password>
NODE_ENV=production
PORT=3004
CORS_ORIGIN=https://<your-vercel-frontend>.vercel.app
```

### Step 4: Deploy
- Click "Deploy"
- Wait for build to complete
- You'll get a URL like: `https://svga-book-bank-api.onrender.com`

---

## PART 2: FRONTEND DEPLOYMENT ON VERCEL

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Import your repository

### Step 2: Configure Project
1. Click "Add New..." → Project
2. Import `BOOKKKKK_BANKKKK` repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `src/frontend`
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `dist`

### Step 3: Set Environment Variables
Add these in Vercel Project Settings → Environment Variables:
```
VITE_API_URL=https://svga-book-bank-api.onrender.com
```

### Step 4: Deploy
- Click "Deploy"
- Wait for build to complete
- You'll get a URL like: `https://svga-book-bank.vercel.app`

---

## PART 3: UPDATE BACKEND CORS

After getting your Vercel URL, update the backend:

1. Go to Render Dashboard
2. Select your backend service
3. Edit Environment Variable:
   - `CORS_ORIGIN=https://<your-vercel-url>.vercel.app`
4. Redeployed (automatic)

---

## VERIFICATION CHECKLIST

- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] Environment variables set correctly on both platforms
- [ ] Frontend can access backend API
- [ ] MongoDB Atlas connection working
- [ ] Frontend displays sponsor images correctly

---

## TROUBLESHOOTING

### Build Fails on Render
- Check `server/package.json` exists
- Verify Node version compatibility
- Check environment variables are set

### Build Fails on Vercel
- Ensure `src/frontend/package.json` exists
- Check `pnpm` is available
- Verify all dependencies are listed

### Frontend Can't Connect to Backend
- Check `VITE_API_URL` environment variable in Vercel
- Verify `CORS_ORIGIN` in Render matches Vercel URL
- Test API endpoint directly in browser

---

## USEFUL LINKS

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Your Backend: Will be provided after deployment
- Your Frontend: Will be provided after deployment
