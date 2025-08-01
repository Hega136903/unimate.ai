# 🌐 Netlify + Render Deployment Guide

## Backend on Render

1. **Create Render Account**
   - Go to https://render.com
   - Connect GitHub account

2. **Deploy Backend**
   - Create new Web Service
   - Connect your repository
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`
   - Add environment variables:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `NODE_ENV=production`

3. **Get Backend URL**
   - Note the service URL (e.g., https://your-app.onrender.com)

## Frontend on Netlify

1. **Create Netlify Account**
   - Go to https://netlify.com
   - Connect GitHub account

2. **Deploy Frontend**
   - Create new site from Git
   - Connect your repository
   - Set build command: `npm run build`
   - Set publish directory: `out`
   - Add environment variables:
     - `NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com`

3. **Configure Redirects**
   Create `public/_redirects` file:
   ```
   /*    /index.html   200
   ```

## Domain Setup
1. Add custom domain in Netlify
2. Update DNS records
3. SSL is automatic
