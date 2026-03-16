#!/bin/bash

# Application Deployment Script
# Run this after ec2-setup.sh

set -e

echo "🚀 Deploying Bl-compiler Compiler..."

# Create application directory
APP_DIR="/opt/Bl-compiler"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone repository (replace with your actual repo)
cd $APP_DIR
git clone https://github.com/yourusername/Bl-compiler-compiler.git .

# Install dependencies
pnpm install

# Build applications
pnpm build

# Create environment file
cat > .env << EOF
# Application
NODE_ENV=production
APP_NAME=Bl-compiler Compiler
APP_VERSION=1.0.0
APP_URL=https://yourdomain.com
APP_PORT=3000
APP_HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://localhost:27017/Bl-compiler
MONGODB_DB_NAME=Bl-compiler

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
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
LOG_DIR=/opt/Bl-compiler/logs
EOF

# Create logs directory
mkdir -p logs

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'apps/api/dist/index.js',
      cwd: '/opt/Bl-compiler',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'worker',
      script: 'apps/worker/dist/index.js',
      cwd: '/opt/Bl-compiler',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_file: './logs/worker-combined.log',
      time: true,
      max_memory_restart: '512M'
    }
  ]
};
EOF

# Create systemd service for PM2
cat > pm2.service << 'EOF'
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=notify
User=ubuntu
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/bin:/usr/local/bin
Environment=PM2_HOME=/home/ubuntu/.pm2
ExecStart=/usr/local/bin/pm2-runtime start /opt/Bl-compiler/ecosystem.config.js
ExecReload=/usr/local/bin/pm2 reload all
ExecStop=/usr/local/bin/pm2 kill

[Install]
WantedBy=multi-user.target
EOF

# Install PM2 service
sudo mv pm2.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pm2

# Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Deployment complete!"
echo "📝 Services started with PM2"
echo "🌐 API available at: http://your-ec2-ip:3000"
echo "📊 Monitor with: pm2 monit"
