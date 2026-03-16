#!/usr/bin/env node

/**
 * Load Test Script for 500 Concurrent Users
 * Tests the optimized system for handling 500+ concurrent users
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
    API_BASE_URL: 'https://backend.blcompiler.com',
    TARGET_CONCURRENT_USERS: 500, // Back to 500 users with 30GB RAM optimizations
    TEST_DURATION_SECONDS: 60,
    RAMP_UP_SECONDS: 10,
    REQUEST_INTERVAL_MS: 200, // 200ms between requests per user for stability
    ENDPOINTS: [
        { path: '/api/v1/auth/register', method: 'POST', weight: 1.0 } // Only registration requests
    ]
};

// Real email addresses to use first
const REAL_EMAILS = [
    'aakashdev24@gmail.com',
    'yfilmyzillla@gmail.com', 
    'akashuiuxd@gmail.com',
    'aakash858400@gmail.com',
    'easyhaiakash@gmail.com'
];

// Test data generators
const generateUserData = (index) => {
    // Generate exact 10-digit mobile number (without +91 prefix as per schema)
    const validMobile = `${Math.floor(6 + Math.random() * 4)}${Math.floor(100000000 + Math.random() * 900000000)}`;
    
    // Use real emails for first 5 users, then dummy emails
    let email;
    if (index < REAL_EMAILS.length) {
        email = REAL_EMAILS[index];
    } else {
        email = `loadtest${index}${Date.now()}${Math.random().toString(36).substr(2, 9)}@loadtest.com`;
    }
    
    return {
        email: email,
        password: `12345678`,
        firstName: `LoadTest${index}`,
        lastName: `User${index}`,
        mobileNumber: validMobile,
        college:   "Nalanda College",
        branch:  "Structural Engineering",
        collegeYear: Math.floor(Math.random() * 4) + 1, // 1-4 years
        registrationNo: `MIT${index}${Math.floor(Math.random() * 1000)}`
    };
};

const generateLoginData = (index) => ({
    email: `loadtest${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@loadtest.com`,
    password: `SecurePass${index}_${Math.random().toString(36).substr(2, 5)}!`
});

// Statistics tracking
class LoadTestStats {
    constructor() {
        this.totalRequests = 0;
        this.successfulRequests = 0;
        this.failedRequests = 0;
        this.responseTimes = [];
        this.errors = new Map();
        this.statusCodes = new Map();
        this.startTime = null;
        this.endTime = null;
        this.concurrentUsers = 0;
    }

    recordRequest(responseTime, statusCode, error = null) {
        this.totalRequests++;
        this.responseTimes.push(responseTime);
        
        if (statusCode >= 200 && statusCode < 300) {
            this.successfulRequests++;
        } else {
            this.failedRequests++;
        }

        // Track status codes
        this.statusCodes.set(statusCode, (this.statusCodes.get(statusCode) || 0) + 1);

        // Track errors
        if (error) {
            const errorKey = error.message || 'Unknown error';
            this.errors.set(errorKey, (this.errors.get(errorKey) || 0) + 1);
        }
    }

    getStats() {
        const duration = (this.endTime || Date.now()) - this.startTime;
        const avgResponseTime = this.responseTimes.length > 0 
            ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
            : 0;
        
        const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
        const p95Index = Math.floor(sortedTimes.length * 0.95);
        const p99Index = Math.floor(sortedTimes.length * 0.99);
        
        return {
            duration: Math.round(duration / 1000),
            totalRequests: this.totalRequests,
            successfulRequests: this.successfulRequests,
            failedRequests: this.failedRequests,
            successRate: this.totalRequests > 0 ? (this.successfulRequests / this.totalRequests * 100).toFixed(2) : 0,
            averageResponseTime: Math.round(avgResponseTime),
            p95ResponseTime: sortedTimes[p95Index] || 0,
            p99ResponseTime: sortedTimes[p99Index] || 0,
            requestsPerSecond: this.totalRequests / (duration / 1000),
            statusCodes: Object.fromEntries(this.statusCodes),
            errors: Object.fromEntries(this.errors),
            concurrentUsers: this.concurrentUsers
        };
    }
}

// HTTP request helper
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        const client = options.protocol === 'https:' ? https : http;
        
        const req = client.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                const endTime = performance.now();
                const responseTime = endTime - startTime;
                
                resolve({
                    statusCode: res.statusCode,
                    responseTime: Math.round(responseTime),
                    data: responseData
                });
            });
        });
        
        req.on('error', (error) => {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            reject({
                error,
                responseTime: Math.round(responseTime)
            });
        });
        
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Simulate a single user - only registration requests
async function simulateUser(userId, stats, isRunning) {
    let requestCount = 0;
    
    while (isRunning.value) {
        try {
            // Generate new user data for each registration attempt
            const userData = generateUserData(userId + requestCount);
            
            const url = new URL('/api/v1/auth/register', CONFIG.API_BASE_URL);
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `LoadTest-User-${userId}`
                }
            };
            
            const result = await makeRequest(options, userData);
            
            // Log registration results
            if (result.statusCode === 201) {
                console.log(`✅ User ${userId} registration #${requestCount + 1} successful (${userData.email})`);
            } else if (result.statusCode === 400) {
                console.log(`❌ User ${userId} registration #${requestCount + 1} failed - validation error (${userData.email})`);
            } else if (result.statusCode === 409) {
                console.log(`⚠️  User ${userId} registration #${requestCount + 1} failed - user already exists (${userData.email})`);
            } else {
                console.log(`❌ User ${userId} registration #${requestCount + 1} failed - status ${result.statusCode} (${userData.email})`);
            }
            
            stats.recordRequest(result.responseTime, result.statusCode);
            requestCount++;
            
        } catch (error) {
            stats.recordRequest(error.responseTime || 0, 0, error.error || error);
            console.log(`User ${userId} request failed:`, error.message);
        }
        
        // Wait before next request
        await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_INTERVAL_MS));
    }
}

// Main load test function
async function runLoadTest() {
    console.log('🚀 Starting Registration Load Test for 500 Concurrent Users');
    console.log(`📊 Target: ${CONFIG.TARGET_CONCURRENT_USERS} concurrent users for ${CONFIG.TEST_DURATION_SECONDS} seconds`);
    console.log(`🌐 API: ${CONFIG.API_BASE_URL}`);
    console.log('📝 Testing: Registration endpoint only');
    console.log('📧 Real emails: aakashdev24@gmail.com, yfilmyzillla@gmail.com, akashuiuxd@gmail.com, aakash858400@gmail.com, easyhaiakash@gmail.com');
    console.log('📧 Dummy emails: loadtest*@loadtest.com (for remaining users)');
    console.log('');
    
    const stats = new LoadTestStats();
    const isRunning = { value: true };
    const users = [];
    
    stats.startTime = performance.now();
    
    // Ramp up users gradually
    console.log('📈 Ramping up users...');
    for (let i = 0; i < CONFIG.TARGET_CONCURRENT_USERS; i++) {
        users.push(simulateUser(i, stats, isRunning));
        stats.concurrentUsers = i + 1;
        
        // Ramp up over 10 seconds
        if (i < CONFIG.TARGET_CONCURRENT_USERS - 1) {
            await new Promise(resolve => 
                setTimeout(resolve, (CONFIG.RAMP_UP_SECONDS * 1000) / CONFIG.TARGET_CONCURRENT_USERS)
            );
        }
        
        if (i % 50 === 0 && i > 0) {
            console.log(`   ${i} users started...`);
        }
    }
    
    console.log(`✅ All ${CONFIG.TARGET_CONCURRENT_USERS} users started`);
    console.log('⏱️  Running load test...');
    
    // Progress reporting
    const progressInterval = setInterval(() => {
        const currentStats = stats.getStats();
        console.log(`📊 Progress: ${currentStats.totalRequests} requests, ${currentStats.successfulRequests} successful, ${currentStats.failedRequests} failed`);
    }, 10000);
    
    // Run test for specified duration
    await new Promise(resolve => setTimeout(resolve, CONFIG.TEST_DURATION_SECONDS * 1000));
    
    // Stop the test
    isRunning.value = false;
    clearInterval(progressInterval);
    
    // Wait for all users to finish
    await Promise.all(users);
    
    stats.endTime = performance.now();
    
    // Generate report
    const finalStats = stats.getStats();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 LOAD TEST RESULTS');
    console.log('='.repeat(60));
    console.log('');
    
    console.log('📈 PERFORMANCE:');
    console.log(`   Total Requests: ${finalStats.totalRequests}`);
    console.log(`   Successful: ${finalStats.successfulRequests}`);
    console.log(`   Failed: ${finalStats.failedRequests}`);
    console.log(`   Success Rate: ${finalStats.successRate}%`);
    console.log(`   Requests/Second: ${Math.round(finalStats.requestsPerSecond)}`);
    console.log(`   Concurrent Users: ${finalStats.concurrentUsers}`);
    console.log('');
    
    console.log('⏱️  RESPONSE TIMES:');
    console.log(`   Average: ${finalStats.averageResponseTime}ms`);
    console.log(`   95th Percentile: ${finalStats.p95ResponseTime}ms`);
    console.log(`   99th Percentile: ${finalStats.p99ResponseTime}ms`);
    console.log('');
    
    console.log('📊 STATUS CODES:');
    Object.entries(finalStats.statusCodes).forEach(([code, count]) => {
        console.log(`   ${code}: ${count}`);
    });
    console.log('');
    
    if (Object.keys(finalStats.errors).length > 0) {
        console.log('❌ ERRORS:');
        Object.entries(finalStats.errors).forEach(([error, count]) => {
            console.log(`   ${error}: ${count}`);
        });
        console.log('');
    }
    
    // Performance assessment
    console.log('🎯 PERFORMANCE ASSESSMENT:');
    if (finalStats.successRate >= 99) {
        console.log('   ✅ Excellent: Success rate >= 99%');
    } else if (finalStats.successRate >= 95) {
        console.log('   ⚠️  Good: Success rate >= 95%');
    } else {
        console.log('   ❌ Poor: Success rate < 95%');
    }
    
    if (finalStats.averageResponseTime <= 500) {
        console.log('   ✅ Excellent: Average response time <= 500ms');
    } else if (finalStats.averageResponseTime <= 1000) {
        console.log('   ⚠️  Good: Average response time <= 1000ms');
    } else {
        console.log('   ❌ Poor: Average response time > 1000ms');
    }
    
    if (finalStats.p95ResponseTime <= 1000) {
        console.log('   ✅ Excellent: 95th percentile <= 1000ms');
    } else if (finalStats.p95ResponseTime <= 2000) {
        console.log('   ⚠️  Good: 95th percentile <= 2000ms');
    } else {
        console.log('   ❌ Poor: 95th percentile > 2000ms');
    }
    
    console.log('');
    console.log('✅ Load test completed!');
    console.log('='.repeat(60));
    
    // Return success/failure based on performance
    return finalStats.successRate >= 95 && finalStats.averageResponseTime <= 1000;
}

// Run the load test
if (require.main === module) {
    runLoadTest()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Load test failed:', error);
            process.exit(1);
        });
}

module.exports = { runLoadTest };
