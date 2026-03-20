#!/bin/bash

# PM2 Monitoring and Maintenance Script for place value Portal Compiler

echo "📊 place value Portal Compiler - System Status"
echo "======================================"

# Check PM2 status
echo ""
echo "🔧 PM2 Services:"
pm2 status

# Check system resources
echo ""
echo "💻 System Resources:"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{printf "%s", $5}')"

# Check service health
echo ""
echo "🏥 Service Health:"
echo "API Health: $(curl -s http://localhost:3000/status | jq -r '.ok // "ERROR"')"
echo "MongoDB: $(systemctl is-active mongod)"
echo "Redis: $(systemctl is-active redis-server)"
echo "Nginx: $(systemctl is-active nginx)"

# Check logs for errors
echo ""
echo "📝 Recent Errors (last 10 lines):"
pm2 logs --err --lines 10

# Check disk space
echo ""
echo "💾 Disk Space:"
df -h

# Check memory usage
echo ""
echo "🧠 Memory Usage:"
free -h

# Check network connections
echo ""
echo "🌐 Network Connections:"
ss -tuln | grep -E ':(3000|80|443|27017|6379)'

echo ""
echo "🔧 Useful Commands:"
echo "  View logs: pm2 logs"
echo "  Monitor: pm2 monit"
echo "  Restart: pm2 restart all"
echo "  Status: pm2 status"
echo "  Nginx logs: sudo tail -f /var/log/nginx/codestruk_error.log"
