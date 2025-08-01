# 🚀 Unimate.AI Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Code Preparation
- [x] Frontend builds successfully (`npm run build`)
- [x] Backend builds successfully (`npm run build`)
- [ ] All environment variables configured
- [ ] API endpoints tested locally
- [ ] CORS settings configured for production
- [ ] Error handling implemented
- [ ] Logging configured

### 2. Database Setup (MongoDB Atlas)
- [ ] Create MongoDB Atlas account
- [ ] Create new cluster (free tier)
- [ ] Create database user
- [ ] Get connection string
- [ ] Test database connection

### 3. Frontend Deployment (Vercel)
- [ ] Create Vercel account
- [ ] Connect GitHub repository
- [ ] Configure build settings:
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`
- [ ] Set environment variables:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_APP_URL`

### 4. Backend Deployment (Railway)
- [ ] Create Railway account
- [ ] Connect GitHub repository
- [ ] Select backend folder as root directory
- [ ] Configure build settings:
  - Build Command: `npm run build`
  - Start Command: `npm start`
- [ ] Set environment variables:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `NODE_ENV=production`
  - `PORT` (Railway will provide)
  - `FRONTEND_URL`

## 📋 Step-by-Step Deployment Guide

### Step 1: Setup MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create account and new project
3. Create cluster (choose free tier M0)
4. Create database user (Database Access)
5. Add IP addresses (Network Access) - Add 0.0.0.0/0 for Railway
6. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/unimate-ai`

### Step 2: Deploy Backend to Railway
1. Go to [Railway](https://railway.app/)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Choose backend folder as root directory
6. Add environment variables in Railway dashboard
7. Deploy and get your backend URL

### Step 3: Deploy Frontend to Vercel
1. Go to [Vercel](https://vercel.com/)
2. Sign up with GitHub
3. Click "New Project" → Import your repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./` (project root)
5. Add environment variables
6. Deploy and get your frontend URL

### Step 4: Configure CORS and Final Settings
1. Update backend CORS settings with your Vercel URL
2. Test all functionality
3. Update any hardcoded localhost URLs

## 🔧 Environment Variables Reference

### Frontend (.env.local in Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_APP_URL=https://your-frontend.vercel.app
```

### Backend (.env in Railway)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/unimate-ai
JWT_SECRET=your-super-secure-secret-key
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app
```

## 🧪 Testing Deployment

### Frontend Testing
- [ ] Homepage loads correctly
- [ ] All components render properly
- [ ] Navigation works
- [ ] API calls work (check browser network tab)

### Backend Testing
- [ ] Health check: `GET https://your-backend.railway.app/api/health`
- [ ] Authentication endpoints work
- [ ] Database connection successful
- [ ] All API routes respond correctly

### Integration Testing
- [ ] User registration/login works
- [ ] Portfolio features work
- [ ] Voting system works
- [ ] Schedule management works
- [ ] All CRUD operations work

## 🚨 Troubleshooting

### Common Issues
1. **CORS Errors**: Update backend CORS settings
2. **Environment Variables**: Check spelling and values
3. **Database Connection**: Verify MongoDB URI and network access
4. **Build Errors**: Check all dependencies are listed in package.json
5. **API 404 Errors**: Verify API base URL configuration

### Debug Commands
```bash
# Test backend locally
cd backend && npm run dev

# Test frontend locally
npm run dev

# Check build outputs
npm run build
cd backend && npm run build
```

## 📝 Post-Deployment Tasks
- [ ] Set up domain name (optional)
- [ ] Configure SSL certificates (auto with Vercel/Railway)
- [ ] Set up monitoring and logging
- [ ] Document API endpoints
- [ ] Set up CI/CD pipeline
- [ ] Configure backup strategy

---
🎉 **Congratulations!** Your Unimate.AI application is now deployed!

Frontend: https://your-app.vercel.app
Backend: https://your-api.railway.app
Database: MongoDB Atlas

---
Generated: ${new Date().toLocaleDateString()}
