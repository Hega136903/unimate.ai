# 🔧 MongoDB Connection Troubleshooting Guide

## Current Issue: Failed to connect to MongoDB Atlas

### Step 1: Check MongoDB Atlas Settings

1. **Go to**: https://cloud.mongodb.com/
2. **Login** with your MongoDB account
3. **Select your project** (Cluster0)

### Step 2: IP Whitelist (Most Common Issue)

1. **Navigate to**: "Security" → "Network Access"
2. **Check if your IP is whitelisted**
3. **Add your current IP** or use `0.0.0.0/0` for testing (allow all IPs)
4. **Click** "Add IP Address" → "Add Current IP Address"

### Step 3: Database User Credentials

1. **Navigate to**: "Security" → "Database Access"
2. **Verify user**: `221501044` exists
3. **Check password**: Should be `Sripriyan@619` (with @ symbol)
4. **Permissions**: Should have "readWrite" to database

### Step 4: Connection String Fixes

Your current connection string:
```
mongodb+srv://221501044:Sripriyan%40619@cluster0.jdhu8rq.mongodb.net/unimate-ai?retryWrites=true&w=majority&appName=Cluster0
```

**Try these alternatives:**

**Option 1: Get fresh connection string from Atlas**
1. Go to "Deployment" → "Database"
2. Click "Connect" → "Connect your application"
3. Copy the new connection string
4. Replace `<password>` with your actual password

**Option 2: Different password encoding**
```
MONGODB_URI=mongodb+srv://221501044:Sripriyan@619@cluster0.jdhu8rq.mongodb.net/unimate-ai?retryWrites=true&w=majority
```

**Option 3: Use URL encoding for special characters**
- `@` = `%40`
- `!` = `%21` 
- `#` = `%23`
- `$` = `%24`
- `%` = `%25`

### Step 5: Test Connection

After making changes:
1. Update `.env` file
2. Restart backend server: `npm start`
3. Check logs for connection success

### Step 6: Alternative - Run Without MongoDB (For Testing Only)

If you want to test AI features without database:
1. Comment out MONGODB_URI in `.env`
2. System will run with in-memory data only

## Common Error Messages:

- **"MongooseServerSelectionError"** = Network/IP whitelist issue
- **"Authentication failed"** = Wrong username/password  
- **"Timeout"** = Network connectivity issue
- **"DNS resolution failed"** = Wrong cluster URL

## Quick Test:
Try connecting with MongoDB Compass using the same connection string to verify credentials work.
