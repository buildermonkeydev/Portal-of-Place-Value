#!/bin/bash

# PM2 Update Script for place value Portal Compiler
# Run this to update your application

set -e

echo "🔄 Updating place value Portal Compiler..."

# Navigate to application directory
cd /opt/place value Portal

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build applications
echo "🔨 Building applications..."
pnpm build

# Restart PM2 services
echo "🔄 Restarting services..."
pm2 restart all

# Save PM2 configuration
pm2 save

echo "✅ Update complete!"
echo "📊 Check status with: pm2 status"
echo "📝 View logs with: pm2 logs"
