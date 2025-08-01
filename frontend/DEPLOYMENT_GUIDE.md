# Unimate.AI Deployment Guide

## 🚀 Deployment Setup

### Prerequisites
- GitHub account
- Vercel account (free)
- Railway/Render account (free)
- MongoDB Atlas account (free)

## Frontend Deployment (Vercel)

### 1. Prepare for Deployment
```bash
npm run build
```

### 2. Environment Variables Needed
Create these in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` = your backend URL
- `NEXT_PUBLIC_APP_URL` = your frontend URL

### 3. Deploy to Vercel
1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Auto-deploy on every push

## Backend Deployment (Railway)

### 1. Prepare Backend
- Build: `npm run build`
- Start: `npm start`

### 2. Environment Variables
- `MONGODB_URI` = MongoDB Atlas connection string
- `JWT_SECRET` = your JWT secret
- `PORT` = 5000 (or Railway assigned port)
- `NODE_ENV` = production

### 3. Deploy Steps
1. Connect GitHub repo to Railway
2. Select backend folder
3. Set environment variables
4. Deploy

## Database Setup (MongoDB Atlas)
1. Create free cluster
2. Setup database user
3. Get connection string
4. Whitelist Railway/Render IPs

## Post-Deployment
1. Update CORS settings in backend
2. Test all API endpoints
3. Update frontend API calls to production URLs

---
Generated on: ${new Date().toLocaleDateString()}
