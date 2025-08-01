# 🚂 Railway Deployment Guide

## Prerequisites
1. Create account at https://railway.app
2. Install Railway CLI: `npm install -g @railway/cli`
3. Login: `railway login`

## Backend Deployment

1. **Initialize Railway Project**
```bash
cd /path/to/uni/uni/backend
railway login
railway init
```

2. **Add Environment Variables**
```bash
railway variables set MONGODB_URI="your-mongodb-connection-string"
railway variables set JWT_SECRET="your-jwt-secret"
railway variables set NODE_ENV="production"
railway variables set PORT="5000"
```

3. **Deploy Backend**
```bash
railway up
```

4. **Get Backend URL**
```bash
railway status
# Note the deployment URL (e.g., https://your-app.railway.app)
```

## Frontend Deployment

1. **Update API URL**
```bash
cd /path/to/uni/uni
# Create .env.production.local
echo "NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app" > .env.production.local
```

2. **Deploy Frontend**
```bash
railway init
railway up
```

## Custom Domain (Optional)
1. Go to Railway dashboard
2. Add custom domain
3. Update DNS records
