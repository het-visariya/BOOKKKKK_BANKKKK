# MONGODB ATLAS QUICK SETUP

## Steps to Get Your Connection String:

### 1. Create MongoDB Atlas Account
- Visit: https://www.mongodb.com/cloud/atlas
- Click "Try Free"
- Sign up with Gmail or email

### 2. Create a Cluster
- Click "Create a Deployment"
- Select "M0 FREE" tier
- Choose region (closest to you)
- Click "Create Deployment"
- Wait 5-10 minutes for cluster creation

### 3. Get Connection String
- Click "Drivers" or "Connect"
- Select "Python" (or Node.js)
- Copy the connection string
- Replace `<username>:<password>` with your credentials
- Replace `myFirstDatabase` with `svga-book-bank`

### 4. Update .env File
In `server/.env`, replace:
```
MONGODB_URI=mongodb://localhost:27017/svga-book-bank
```

With your MongoDB Atlas connection string:
```
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/svga-book-bank?retryWrites=true&w=majority
```

### 5. Restart Server
Run in server directory:
```bash
npm start
```

## Alternative: Use Local MongoDB

If you prefer local MongoDB:
1. Download from: https://www.mongodb.com/try/download/community
2. Install and run
3. Server will connect to `mongodb://localhost:27017/svga-book-bank` automatically

---

## Testing the Connection

Once MongoDB is set up, you should see:
```
[DB] MongoDB connected successfully
[Server] SVGA Book Bank API running on port 3001
[Server] Made by Devansh Nisar
```

Then your admin/student logins will work!
