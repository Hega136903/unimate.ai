#!/bin/bash
# Frontend deployment script for Vercel

echo "🚀 Starting frontend deployment setup..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build Next.js application
echo "🔨 Building Next.js application..."
npm run build

echo "✅ Frontend build complete!"
