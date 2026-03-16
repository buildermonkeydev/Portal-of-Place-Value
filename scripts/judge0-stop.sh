#!/bin/bash

echo "🛑 Stopping Judge0 with 4 Worker Instances..."

# Navigate to judge0 directory
cd apps/judge0

# Stop Judge0 containers
docker-compose -f docker-compose.scaled.yml down

echo "✅ Judge0 stopped successfully!"
echo "💡 To start again: ./scripts/judge0-setup.sh"

# Return to project root
cd ../..
