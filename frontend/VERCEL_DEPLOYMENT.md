# 🚀 Vercel Deployment Guide

## Frontend Deployment

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy Frontend**
```bash
cd /path/to/uni/uni
vercel --prod
```

## Backend Options for Vercel

### Option A: Serverless Functions (Recommended)
1. Move backend code to `/api` folder in frontend
2. Convert Express routes to Vercel serverless functions
3. Update API calls to use relative paths

### Option B: External Backend (Use with Railway/Render)
1. Deploy backend separately (see Railway guide below)
2. Update NEXT_PUBLIC_API_URL in frontend environment

## Environment Variables
Add these to Vercel dashboard:
- `NEXT_PUBLIC_API_URL=your-backend-url`
- `MONGODB_URI=your-mongodb-connection-string`
- `JWT_SECRET=your-jwt-secret`

## Domain Setup
1. Add custom domain in Vercel dashboard
2. Update DNS records
3. SSL certificate is automatic
