#!/bin/bash

echo "📊 Redis Performance Monitor"
echo "=========================="

# Check if Redis is running
if ! docker exec compiler-redis redis-cli ping &> /dev/null; then
    echo "❌ Redis is not running. Start it with: ./scripts/redis-setup.sh"
    exit 1
fi

echo "🔍 Redis Status:"
docker exec compiler-redis redis-cli info server | grep -E "(redis_version|uptime_in_seconds|connected_clients|used_memory_human|total_commands_processed|instantaneous_ops_per_sec)"

echo ""
echo "📈 Memory Usage:"
docker exec compiler-redis redis-cli info memory | grep -E "(used_memory_human|used_memory_peak_human|maxmemory_human|mem_fragmentation_ratio)"

echo ""
echo "🔗 Client Connections:"
docker exec compiler-redis redis-cli info clients | grep -E "(connected_clients|client_recent_max_input_buffer|client_recent_max_output_buffer)"

echo ""
echo "⚡ Performance:"
docker exec compiler-redis redis-cli info stats | grep -E "(total_commands_processed|instantaneous_ops_per_sec|keyspace_hits|keyspace_misses)"

echo ""
echo "📋 Queue Status:"
docker exec compiler-redis redis-cli keys "*queue*" | wc -l | xargs echo "Active queues:"

echo ""
echo "🌐 Web UI: http://localhost:8081"
echo "🔗 Connection: redis://localhost:6379"
