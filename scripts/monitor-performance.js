#!/usr/bin/env node

/**
 * Performance Monitoring Dashboard
 * Real-time monitoring of system performance for 500+ concurrent users
 */

const http = require('http');
const { performance } = require('perf_hooks');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const MONITOR_INTERVAL = 5000; // 5 seconds

class PerformanceMonitor {
    constructor() {
        this.startTime = performance.now();
        this.previousStats = null;
        this.isRunning = false;
    }

    async getHealthStatus() {
        try {
            const startTime = performance.now();
            const response = await this.makeRequest('/status');
            const responseTime = performance.now() - startTime;
            
            if (response.statusCode === 200) {
                const data = JSON.parse(response.data);
                return {
                    healthy: true,
                    responseTime: Math.round(responseTime),
                    data: data
                };
            } else {
                return {
                    healthy: false,
                    responseTime: Math.round(responseTime),
                    error: `HTTP ${response.statusCode}`
                };
            }
        } catch (error) {
            return {
                healthy: false,
                responseTime: 0,
                error: error.message
            };
        }
    }

    makeRequest(path) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, API_BASE_URL);
            const options = {
                hostname: url.hostname,
                port: url.port || 80,
                path: url.pathname + url.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'PerformanceMonitor/1.0'
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, data }));
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    }

    clearScreen() {
        process.stdout.write('\x1B[2J\x1B[0f');
    }

    displayHeader() {
        console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
        console.log('║                    🚀 PERFORMANCE MONITORING DASHBOARD 🚀                    ║');
        console.log('║                        Optimized for 500+ Concurrent Users                    ║');
        console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
        console.log('');
    }

    displaySystemStatus(health) {
        const status = health.healthy ? '🟢 HEALTHY' : '🔴 UNHEALTHY';
        const responseTime = health.responseTime;
        const responseTimeStatus = responseTime < 100 ? '🟢' : responseTime < 500 ? '🟡' : '🔴';
        
        console.log('┌─ SYSTEM STATUS ──────────────────────────────────────────────────────────────┐');
        console.log(`│ Status: ${status.padEnd(20)} Response Time: ${responseTimeStatus} ${responseTime}ms${' '.repeat(20 - responseTime.toString().length)}│`);
        
        if (health.healthy && health.data) {
            const data = health.data;
            const uptime = this.formatUptime(data.uptime || 0);
            console.log(`│ Uptime: ${uptime.padEnd(20)} Timestamp: ${new Date().toISOString().substr(11, 8)}${' '.repeat(20)}│`);
        } else if (health.error) {
            console.log(`│ Error: ${health.error.padEnd(60)}│`);
        }
        
        console.log('└─────────────────────────────────────────────────────────────────────────────┘');
        console.log('');
    }

    displayPerformanceMetrics(health) {
        if (!health.healthy || !health.data || !health.data.performance) {
            console.log('┌─ PERFORMANCE METRICS ──────────────────────────────────────────────────────┐');
            console.log('│ No performance data available                                              │');
            console.log('└─────────────────────────────────────────────────────────────────────────────┘');
            console.log('');
            return;
        }

        const perf = health.data.performance;
        const totalRequests = perf.totalRequests || 0;
        const avgResponseTime = perf.averageResponseTime || 0;
        const rps = perf.requestsPerSecond || 0;
        const slowRequests = perf.slowRequests || 0;
        const errorRate = perf.errorRate || 0;

        console.log('┌─ PERFORMANCE METRICS ──────────────────────────────────────────────────────┐');
        console.log(`│ Total Requests: ${totalRequests.toString().padEnd(15)} Avg Response: ${avgResponseTime}ms${' '.repeat(15 - avgResponseTime.toString().length)}│`);
        console.log(`│ Requests/sec: ${Math.round(rps).toString().padEnd(20)} Slow Requests: ${slowRequests}${' '.repeat(15 - slowRequests.toString().length)}│`);
        console.log(`│ Error Rate: ${errorRate}%${' '.repeat(20)} Status: ${errorRate < 1 ? '🟢' : errorRate < 5 ? '🟡' : '🔴'}${' '.repeat(25)}│`);
        console.log('└─────────────────────────────────────────────────────────────────────────────┘');
        console.log('');
    }

    displayMemoryUsage(health) {
        if (!health.healthy || !health.data || !health.data.memory) {
            console.log('┌─ MEMORY USAGE ────────────────────────────────────────────────────────────┐');
            console.log('│ No memory data available                                                 │');
            console.log('└─────────────────────────────────────────────────────────────────────────────┘');
            console.log('');
            return;
        }

        const mem = health.data.memory;
        const heapUsed = this.formatBytes(mem.heapUsed || 0);
        const heapTotal = this.formatBytes(mem.heapTotal || 0);
        const rss = this.formatBytes(mem.rss || 0);
        const external = this.formatBytes(mem.external || 0);

        const heapUsedMB = (mem.heapUsed || 0) / 1024 / 1024;
        const memoryStatus = heapUsedMB < 500 ? '🟢' : heapUsedMB < 1000 ? '🟡' : '🔴';

        console.log('┌─ MEMORY USAGE ────────────────────────────────────────────────────────────┐');
        console.log(`│ Heap Used: ${heapUsed.padEnd(15)} Heap Total: ${heapTotal.padEnd(15)} Status: ${memoryStatus}${' '.repeat(10)}│`);
        console.log(`│ RSS: ${rss.padEnd(20)} External: ${external.padEnd(15)}${' '.repeat(20)}│`);
        console.log('└─────────────────────────────────────────────────────────────────────────────┘');
        console.log('');
    }

    displayDatabaseStatus(health) {
        if (!health.healthy || !health.data) {
            console.log('┌─ DATABASE STATUS ─────────────────────────────────────────────────────────┐');
            console.log('│ No database data available                                               │');
            console.log('└─────────────────────────────────────────────────────────────────────────────┘');
            console.log('');
            return;
        }

        const dbConnected = health.data.database?.connected || false;
        const redisStatus = health.data.redis?.status || 'unknown';
        
        const dbStatus = dbConnected ? '🟢 CONNECTED' : '🔴 DISCONNECTED';
        const redisStatusIcon = redisStatus === 'healthy' ? '🟢' : '🔴';

        console.log('┌─ DATABASE STATUS ─────────────────────────────────────────────────────────┐');
        console.log(`│ MongoDB: ${dbStatus.padEnd(20)} Redis: ${redisStatusIcon} ${redisStatus.toUpperCase()}${' '.repeat(20 - redisStatus.length)}│`);
        console.log('└─────────────────────────────────────────────────────────────────────────────┘');
        console.log('');
    }

    displayQueueStatus(health) {
        if (!health.healthy || !health.data || !health.data.queue) {
            console.log('┌─ QUEUE STATUS ────────────────────────────────────────────────────────────┐');
            console.log('│ No queue data available                                                 │');
            console.log('└─────────────────────────────────────────────────────────────────────────────┘');
            console.log('');
            return;
        }

        const queue = health.data.queue;
        const currentQueueSize = queue.currentQueueSize || 0;
        const currentProcessing = queue.currentProcessing || 0;
        const maxConcurrent = queue.maxConcurrent || 0;
        const totalProcessed = queue.totalProcessed || 0;
        const totalRejected = queue.totalRejected || 0;

        const queueStatus = currentQueueSize < maxConcurrent * 0.8 ? '🟢' : '🟡';
        const processingStatus = currentProcessing < maxConcurrent * 0.9 ? '🟢' : '🔴';

        console.log('┌─ QUEUE STATUS ────────────────────────────────────────────────────────────┐');
        console.log(`│ Queue Size: ${currentQueueSize.toString().padEnd(15)} Processing: ${currentProcessing}/${maxConcurrent}${' '.repeat(10)}│`);
        console.log(`│ Processed: ${totalProcessed.toString().padEnd(20)} Rejected: ${totalRejected}${' '.repeat(15 - totalRejected.toString().length)}│`);
        console.log(`│ Queue Status: ${queueStatus}${' '.repeat(20)} Processing Status: ${processingStatus}${' '.repeat(15)}│`);
        console.log('└─────────────────────────────────────────────────────────────────────────────┘');
        console.log('');
    }

    displayFooter() {
        const elapsed = (performance.now() - this.startTime) / 1000;
        console.log('┌─ MONITORING INFO ──────────────────────────────────────────────────────────┐');
        console.log(`│ Monitoring for: ${this.formatUptime(elapsed).padEnd(20)} Refresh: ${MONITOR_INTERVAL/1000}s${' '.repeat(15)}│`);
        console.log('│ Press Ctrl+C to stop monitoring                                            │');
        console.log('└─────────────────────────────────────────────────────────────────────────────┘');
    }

    async update() {
        this.clearScreen();
        this.displayHeader();
        
        const health = await this.getHealthStatus();
        this.displaySystemStatus(health);
        this.displayPerformanceMetrics(health);
        this.displayMemoryUsage(health);
        this.displayDatabaseStatus(health);
        this.displayQueueStatus(health);
        this.displayFooter();
    }

    start() {
        this.isRunning = true;
        console.log('🚀 Starting performance monitoring...');
        console.log(`📊 Monitoring API: ${API_BASE_URL}`);
        console.log(`⏱️  Refresh interval: ${MONITOR_INTERVAL/1000} seconds`);
        console.log('');

        const monitor = async () => {
            if (this.isRunning) {
                await this.update();
                setTimeout(monitor, MONITOR_INTERVAL);
            }
        };

        monitor();

        // Handle Ctrl+C
        process.on('SIGINT', () => {
            console.log('\n\n🛑 Stopping performance monitoring...');
            this.isRunning = false;
            process.exit(0);
        });
    }
}

// Start monitoring
if (require.main === module) {
    const monitor = new PerformanceMonitor();
    monitor.start();
}

module.exports = { PerformanceMonitor };
