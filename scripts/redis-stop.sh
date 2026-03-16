#!/bin/bash

echo "🛑 Stopping Local Redis..."

# Stop Redis containers
docker-compose -f docker-compose.redis.yml down

echo "✅ Redis stopped successfully!"
echo "💡 To start again: ./scripts/redis-setup.sh"
