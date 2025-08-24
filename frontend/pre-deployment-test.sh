#!/bin/bash

echo "🚀 Pre-Deployment Build Test for Unimate.AI"
echo "=============================================="

# Test Backend Build
echo "📦 Testing backend build..."
cd backend
npm install
if npm run build; then
    echo "✅ Backend build successful!"
else
    echo "❌ Backend build failed!"
    exit 1
fi
cd ..

# Test Frontend Build  
echo "📦 Testing frontend build..."
if npm install && npm run build; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

echo ""
echo "🎉 All builds successful! Ready for deployment."
echo ""
echo "Next Steps:"
echo "1. Deploy backend to Render"
echo "2. Deploy frontend to Vercel" 
echo "3. Update CORS settings"
echo "4. Test live application"
echo ""
echo "See RENDER_VERCEL_DEPLOYMENT.md for detailed instructions."
