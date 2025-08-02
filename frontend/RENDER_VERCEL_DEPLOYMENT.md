# 🚀 Render + Vercel Deployment Guide for Unimate.AI

## 📋 **Overview**
This guide will deploy:
- **Backend (Node.js + Express)** → **Render**
- **Frontend (Next.js)** → **Vercel**

---

## 🔧 **Part 1: Backend Deployment on Render**

### **Step 1: Prepare Your Backend for Production**

#### 1.1 Update package.json Scripts
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "nodemon src/server.ts",
    "postbuild": "echo 'Build completed successfully'"
  }
}
```

#### 1.2 Create Render Build Script
Create `render-build.sh` in your backend folder:
```bash
#!/bin/bash
echo "🔨 Building backend for production..."
npm install
npm run build
echo "✅ Backend build completed!"
```

#### 1.3 Update Your Server for Production
Ensure your `src/server.ts` uses environment PORT:
```typescript
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Unimate.AI Backend server running on port ${PORT}`);
});
```

### **Step 2: Deploy Backend to Render**

#### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your repository

#### 2.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the backend folder path: `backend`

#### 2.3 Configure Render Settings
```
Name: unimate-ai-backend
Environment: Node
Region: Oregon (US West) or closest to you
Branch: main
Root Directory: backend
Build Command: npm install && npm run build
Start Command: npm start
```

#### 2.4 Set Environment Variables on Render
Go to **Environment** tab and add:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://221501044:Sripriyan%40619@cluster0.jdhu8rq.mongodb.net/unimate-ai?retryWrites=true&w=majority
JWT_SECRET=unimate-ai-production-jwt-secret-key-minimum-32-characters-2025-render
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://your-vercel-domain.vercel.app
EMAIL_SERVICE=gmail
EMAIL_USER=221501044@rajalakshmi.edu.in
EMAIL_PASSWORD=jtijmqkxorpiciit
EMAIL_FROM=Unimate.AI <221501044@rajalakshmi.edu.in>
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

**⚠️ Important**: Update `CORS_ORIGIN` and `FRONTEND_URL` with your actual Vercel domain after frontend deployment.

#### 2.5 Deploy Backend
1. Click **"Create Web Service"**
2. Wait for build to complete (5-10 minutes)
3. Your backend will be available at: `https://unimate-ai-backend.onrender.com`

---

## 🎨 **Part 2: Frontend Deployment on Vercel**

### **Step 1: Prepare Frontend for Production**

#### 1.1 Update API Base URL
Update `app/lib/api.ts`:
```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://unimate-ai-backend.onrender.com/api'
  : 'http://localhost:5000/api';
```

#### 1.2 Create vercel.json Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://unimate-ai-backend.onrender.com/api/$1"
    }
  ]
}
```

### **Step 2: Deploy Frontend to Vercel**

#### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account

#### 2.2 Import Project
1. Click **"New Project"**
2. Import your GitHub repository
3. Select the root directory (where package.json is)

#### 2.3 Configure Vercel Settings
```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### 2.4 Set Environment Variables
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://unimate-ai-backend.onrender.com/api
```

#### 2.5 Deploy Frontend
1. Click **"Deploy"**
2. Wait for build (3-5 minutes)
3. Your frontend will be available at: `https://unimate-ai-xxx.vercel.app`

---

## 🔄 **Part 3: Connect Frontend and Backend**

### **Step 1: Update Backend CORS**
1. Go to your Render dashboard
2. Update environment variables:
```env
CORS_ORIGIN=https://your-actual-vercel-domain.vercel.app
FRONTEND_URL=https://your-actual-vercel-domain.vercel.app
```

### **Step 2: Update Frontend API URL**
1. Go to your Vercel dashboard
2. Update environment variables:
```env
NEXT_PUBLIC_API_URL=https://unimate-ai-backend.onrender.com/api
```

### **Step 3: Redeploy Both Services**
1. **Render**: Go to "Manual Deploy" → "Deploy latest commit"
2. **Vercel**: Push any small change to trigger automatic redeploy

---

## ✅ **Part 4: Verify Deployment**

### **Test Your Deployed Application**
1. **Backend Health Check**: 
   ```
   GET https://unimate-ai-backend.onrender.com/api/health
   ```

2. **Frontend Access**: 
   ```
   https://your-vercel-domain.vercel.app
   ```

3. **Full Functionality Test**:
   - User registration/login
   - Schedule management
   - Email notifications
   - Voting system
   - Admin panel

---

## 🔒 **Security Checklist**

- ✅ Updated JWT secret for production
- ✅ CORS configured for production domain
- ✅ MongoDB Atlas IP whitelist updated (0.0.0.0/0 for cloud deployment)
- ✅ Environment variables secured
- ✅ Email credentials protected

---

## 📊 **Monitoring & Maintenance**

### **Render Backend Monitoring**
- View logs in Render dashboard
- Monitor resource usage
- Set up alerts for downtime

### **Vercel Frontend Analytics**
- Built-in analytics dashboard
- Performance monitoring
- Error tracking

---

## 🚨 **Troubleshooting**

### **Common Issues**

1. **CORS Errors**
   ```
   Solution: Update CORS_ORIGIN in Render environment variables
   ```

2. **API Connection Failed**
   ```
   Solution: Check NEXT_PUBLIC_API_URL in Vercel settings
   ```

3. **Email Not Working**
   ```
   Solution: Verify EMAIL_* variables in Render environment
   ```

4. **MongoDB Connection Error**
   ```
   Solution: Check MongoDB Atlas network access (allow all IPs: 0.0.0.0/0)
   ```

---

## 🎯 **Next Steps After Deployment**

1. **Custom Domain** (Optional)
   - Add custom domain to Vercel
   - Update CORS settings accordingly

2. **SSL Certificate** 
   - Automatically provided by both Render and Vercel

3. **Performance Optimization**
   - Monitor response times
   - Optimize database queries
   - Enable caching where appropriate

4. **Backup Strategy**
   - MongoDB Atlas automatic backups
   - Code repository backup

---

**🎉 Congratulations! Your Unimate.AI application is now live on Render + Vercel!**
