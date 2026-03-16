#!/bin/bash

# PM2 + Nginx Deployment Script for Bl-compiler Compiler
# Run this after pm2-nginx-setup.sh

set -e

echo "🚀 Deploying Bl-compiler Compiler with PM2 + Nginx..."

# Navigate to application directory
cd /opt/blcompiler

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build applications
echo "🔨 Building applications..."
pnpm build

# Create environment file
echo "⚙️ Creating environment configuration..."
cat > .env << 'EOF'
# Application
NODE_ENV=production
APP_NAME=Bl-compiler Compiler
APP_VERSION=1.0.0
APP_URL=https://yourdomain.com
APP_PORT=3000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://localhost:27017/blcompiler
MONGODB_DB_NAME=blcompiler

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=30d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# CORS
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache
REDIS_CACHE_TTL=3600
REDIS_CACHE_PREFIX=cache:
REDIS_SESSION_TTL=86400
REDIS_SESSION_PREFIX=session:
REDIS_SESSION_MAX_PER_USER=5

# Logging
LOG_LEVEL=info
LOG_DIR=/opt/blcompiler/logs
EOF

# Create logs directory
mkdir -p logs

# Create PM2 ecosystem file
echo "📋 Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'apps/api/dist/index.js',
      cwd: '/opt/blcompiler',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'worker',
      script: 'apps/worker/dist/index.js',
      cwd: '/opt/blcompiler',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_file: './logs/worker-combined.log',
      time: true,
      max_memory_restart: '512M',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# Create systemd service for PM2
echo "🔧 Creating PM2 systemd service..."
sudo tee /etc/systemd/system/pm2-blcompiler.service > /dev/null << 'EOF'
[Unit]
Description=PM2 process manager for Bl-compiler Compiler
Documentation=https://pm2.keymetrics.io/
After=network.target mongodb.service redis.service

[Service]
Type=notify
User=ubuntu
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/bin:/usr/local/bin
Environment=PM2_HOME=/home/ubuntu/.pm2
ExecStart=/usr/local/bin/pm2-runtime start /opt/blcompiler/ecosystem.config.js
ExecReload=/usr/local/bin/pm2 reload all
ExecStop=/usr/local/bin/pm2 kill

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/blcompiler > /dev/null << 'EOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

# Upstream for API
upstream api_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Health check endpoint
    location /health {
        proxy_pass http://api_backend/status;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        access_log off;
    }

    # API routes with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Auth routes with stricter rate limiting
    location /api/v1/auth/ {
        limit_req zone=auth burst=10 nodelay;
        
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (if any)
    location /static/ {
        alias /opt/blcompiler/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Default route
    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logging
    access_log /var/log/nginx/blcompiler_access.log;
    error_log /var/log/nginx/blcompiler_error.log;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/blcompiler /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload systemd and start services
sudo systemctl daemon-reload
sudo systemctl enable pm2-blcompiler
sudo systemctl enable nginx

# Start PM2 services
pm2 start ecosystem.config.js
pm2 save

# Start systemd service
sudo systemctl start pm2-blcompiler
sudo systemctl start nginx

# Setup PM2 startup
pm2 startup systemd -u $USER --hp $HOME

echo "✅ Deployment complete!"
echo ""
echo "🎉 Your application is now running!"
echo "📊 Monitor with: pm2 monit"
echo "📝 View logs with: pm2 logs"
echo "🔄 Restart with: pm2 restart all"
echo ""
echo "🌐 Next steps:"
echo "1. Update your domain in /opt/blcompiler/.env"
echo "2. Update Nginx config: sudo nano /etc/nginx/sites-available/blcompiler"
echo "3. Setup SSL: sudo certbot --nginx -d yourdomain.com"
echo "4. Test your API: curl http://your-ec2-ip/health"
