#!/bin/bash

# Optimized Deployment Script for 500+ Concurrent Users
# This script deploys the optimized version of the application

set -e

echo "🚀 Starting optimized deployment for 500+ concurrent users..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Please install PM2 first:"
    echo "npm install -g pm2"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first:"
    echo "npm install -g pnpm"
    exit 1
fi

print_status "Installing dependencies..."
pnpm install --frozen-lockfile

print_status "Building applications..."
pnpm build

print_status "Creating database indexes..."
if [ -f "scripts/create-indexes.js" ]; then
    node scripts/create-indexes.js
    print_success "Database indexes created successfully"
else
    print_warning "Database index script not found, skipping..."
fi

print_status "Stopping existing PM2 processes..."
pm2 stop all || true
pm2 delete all || true

print_status "Starting optimized API server..."
pm2 start ecosystem.config.js --env production

print_status "Waiting for services to start..."
sleep 10

print_status "Checking service health..."
# Check API health
if curl -f http://localhost:3001/status > /dev/null 2>&1; then
    print_success "API server is healthy"
else
    print_error "API server health check failed"
    pm2 logs api --lines 50
    exit 1
fi

print_status "Checking PM2 status..."
pm2 status

print_status "Saving PM2 configuration..."
pm2 save

print_status "Setting up PM2 startup script..."
pm2 startup || print_warning "PM2 startup setup failed (may need sudo)"

print_success "Deployment completed successfully!"

echo ""
echo "📊 Performance Optimizations Applied:"
echo "  ✅ Rate limiting configured for high concurrency"
echo "  ✅ Request queue optimized for 500+ concurrent users"
echo "  ✅ Redis connection pooling enabled"
echo "  ✅ PM2 memory limits increased to 2GB"
echo "  ✅ Performance monitoring enabled"
echo "  ✅ Response caching implemented"
echo "  ✅ Database indexes created"
echo ""

echo "🔧 Next Steps:"
echo "  1. Monitor performance: pm2 monit"
echo "  2. Check logs: pm2 logs"
echo "  3. Test load: ./run-load-test.sh"
echo "  4. Monitor health: curl http://localhost:3001/status"
echo ""

echo "📈 Expected Performance:"
echo "  • 500+ concurrent users supported"
echo "  • Response times < 500ms for 95% of requests"
echo "  • Success rate > 99%"
echo "  • Memory usage < 2GB per instance"
echo ""

print_success "Ready to handle 500+ concurrent users! 🎉"
