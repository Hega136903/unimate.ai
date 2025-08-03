#!/bin/bash
# Backend deployment script for Render

echo "🚀 Starting backend deployment setup..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Start the server
echo "✅ Starting server..."
npm start
