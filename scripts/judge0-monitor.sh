#!/bin/bash

echo "📊 Judge0 Performance Monitor"
echo "============================"

# Navigate to judge0 directory
cd apps/judge0

# Check if Judge0 is running
if ! docker-compose -f docker-compose.scaled.yml ps | grep -q "Up"; then
    echo "❌ Judge0 is not running. Start it with: ./scripts/judge0-setup.sh"
    exit 1
fi

echo "🔍 Container Status:"
docker-compose -f docker-compose.scaled.yml ps

echo ""
echo "📈 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $(docker-compose -f docker-compose.scaled.yml ps -q)

echo ""
echo "🌐 API Health Check:"
if curl -s http://localhost:2358/ | grep -q "Judge0"; then
    echo "✅ API Server: Healthy"
else
    echo "❌ API Server: Unhealthy"
fi

echo ""
echo "📋 Queue Status:"
# Check Redis queue status
docker exec $(docker-compose -f docker-compose.scaled.yml ps -q redis) redis-cli -a anothersecret llen "queue" 2>/dev/null || echo "Queue check failed"

echo ""
echo "🔧 Worker Status:"
for i in {1..4}; do
    if docker-compose -f docker-compose.scaled.yml ps | grep -q "worker-$i.*Up"; then
        echo "✅ Worker $i: Running"
    else
        echo "❌ Worker $i: Not running"
    fi
done

echo ""
echo "📊 Performance Metrics:"
echo "   - API Endpoint: http://localhost:2358"
echo "   - Workers: 4 instances"
echo "   - Max Queue Size: 1000"
echo "   - Memory Limit: 512MB per submission"
echo "   - Time Limit: 15 seconds"

# Return to project root
cd ../..
