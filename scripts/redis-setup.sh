#!/bin/bash

echo "🐳 Setting up Local Redis with Docker for High Performance..."

# 1. Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Ubuntu/Debian: sudo apt install docker.io docker-compose"
    echo "   CentOS/RHEL: sudo yum install docker docker-compose"
    exit 1
fi

# 2. Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# 3. Create Redis data directory
echo "📁 Creating Redis data directory..."
mkdir -p ./redis-data

# 4. Start Redis with Docker Compose
echo "🚀 Starting Redis container..."
docker-compose -f docker-compose.redis.yml up -d

# 5. Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
sleep 10

# 6. Test Redis connection
echo "🔍 Testing Redis connection..."
if docker exec compiler-redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is running successfully!"
    echo "📊 Redis Info:"
    docker exec compiler-redis redis-cli info server | grep -E "(redis_version|uptime_in_seconds|connected_clients|used_memory_human)"
    echo ""
    echo "🌐 Redis Commander (Web UI): http://localhost:8081"
    echo "🔗 Redis Connection: redis://localhost:6379"
    echo ""
    echo "✅ Local Redis setup complete!"
    echo "   - No connection limits"
    echo "   - 8GB memory limit"
    echo "   - Optimized for 500+ concurrent users"
    echo "   - Web UI available at http://localhost:8081"
else
    echo "❌ Redis failed to start. Check logs:"
    docker-compose -f docker-compose.redis.yml logs redis
    exit 1
fi
