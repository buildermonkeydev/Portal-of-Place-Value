#!/bin/bash

echo "⚖️  Setting up Judge0 with 4 Worker Instances for High Performance..."

# Navigate to judge0 directory
cd apps/judge0

# 1. Stop existing Judge0 containers
echo "🛑 Stopping existing Judge0 containers..."
docker-compose down 2>/dev/null || true

# 2. Remove old containers and volumes (optional)
echo "🧹 Cleaning up old containers..."
docker-compose -f docker-compose.scaled.yml down -v 2>/dev/null || true

# 3. Start Judge0 with 4 workers
echo "🚀 Starting Judge0 with 4 worker instances..."
docker-compose -f docker-compose.scaled.yml up -d

# 4. Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# 5. Check service status
echo "🔍 Checking service status..."
docker-compose -f docker-compose.scaled.yml ps

# 6. Test Judge0 API
echo "🧪 Testing Judge0 API..."
sleep 10

# Test with a simple API call
if curl -s http://localhost:2358/ | grep -q "Judge0"; then
    echo "✅ Judge0 API is responding!"
    echo ""
    echo "📊 Judge0 Status:"
    echo "   - API Server: http://localhost:2358"
    echo "   - Workers: 4 instances"
    echo "   - Database: PostgreSQL"
    echo "   - Cache: Redis"
    echo "   - Load Balancer: Nginx (optional)"
    echo ""
    echo "🔧 Configuration:"
    echo "   - Max concurrent submissions: 1000"
    echo "   - Memory limit: 512MB per submission"
    echo "   - Time limit: 15 seconds"
    echo "   - Optimized for 500+ concurrent users"
    echo ""
    echo "✅ Judge0 setup complete!"
else
    echo "❌ Judge0 API is not responding. Check logs:"
    docker-compose -f docker-compose.scaled.yml logs server
    exit 1
fi

# Return to project root
cd ../..
