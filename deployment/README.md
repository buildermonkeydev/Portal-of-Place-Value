# 🚀 Bl-compiler Compiler - EC2 Deployment Guide

This guide covers multiple deployment strategies for your monorepo application on AWS EC2.

## 📋 Prerequisites

- AWS EC2 instance (t3.medium or larger recommended)
- Ubuntu 20.04+ or Amazon Linux 2
- Domain name (optional, for production)
- SSL certificate (for HTTPS)

## 🎯 Deployment Options

### Option 1: Simple PM2 Deployment (Recommended for beginners)

#### Step 1: Setup EC2 Instance
```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run the setup script
curl -sSL https://raw.githubusercontent.com/yourusername/Bl-compiler-compiler/main/deployment/ec2-setup.sh | bash
```

#### Step 2: Deploy Application
```bash
# Clone your repository
git clone https://github.com/yourusername/Bl-compiler-compiler.git
cd Bl-compiler-compiler

# Run deployment script
chmod +x deployment/deploy.sh
./deployment/deploy.sh
```

#### Step 3: Configure Nginx
```bash
# Copy Nginx configuration
sudo cp deployment/nginx.conf /etc/nginx/sites-available/Bl-compiler
sudo ln -s /etc/nginx/sites-available/Bl-compiler /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 4: Setup SSL (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Option 2: Docker Compose Deployment (Recommended for production)

#### Step 1: Setup EC2 Instance
```bash
# Install Docker and Docker Compose
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Step 2: Deploy with Docker Compose
```bash
# Clone repository
git clone https://github.com/yourusername/Bl-compiler-compiler.git
cd Bl-compiler-compiler

# Copy environment file
cp deployment/env.example .env
# Edit .env with your actual values
nano .env

# Start services
docker-compose -f deployment/docker-compose.yml up -d
```

### Option 3: AWS ECS Deployment (Enterprise)

#### Step 1: Create ECS Cluster
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name Bl-compiler-cluster

# Create task definition
aws ecs register-task-definition --cli-input-json file://deployment/ecs-task-definition.json

# Create service
aws ecs create-service --cluster Bl-compiler-cluster --service-name Bl-compiler-service --task-definition Bl-compiler-task
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/Bl-compiler
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application
NODE_ENV=production
APP_URL=https://yourdomain.com
```

### Security Groups

Configure your EC2 security groups:

- **Port 22**: SSH access (your IP only)
- **Port 80**: HTTP traffic
- **Port 443**: HTTPS traffic
- **Port 3000**: API access (if not using Nginx)
- **Port 27017**: MongoDB (if external access needed)
- **Port 6379**: Redis (if external access needed)

## 📊 Monitoring

### PM2 Monitoring
```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# Restart services
pm2 restart all

# View status
pm2 status
```

### Docker Monitoring
```bash
# View logs
docker-compose logs -f

# View container status
docker-compose ps

# Restart services
docker-compose restart
```

### Health Checks

- **API Health**: `https://yourdomain.com/health`
- **Worker Status**: Check PM2 logs or Docker logs
- **Database**: `mongosh mongodb://localhost:27017/Bl-compiler`
- **Redis**: `redis-cli ping`

## 🔄 Updates and Maintenance

### PM2 Deployment
```bash
# Pull latest changes
git pull origin main

# Install dependencies
pnpm install

# Build applications
pnpm build

# Restart services
pm2 restart all
```

### Docker Deployment
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f deployment/docker-compose.yml up -d --build
```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Permission denied**
   ```bash
   sudo chown -R $USER:$USER /opt/Bl-compiler
   ```

3. **Database connection failed**
   ```bash
   sudo systemctl status mongod
   sudo systemctl restart mongod
   ```

4. **Redis connection failed**
   ```bash
   sudo systemctl status redis-server
   sudo systemctl restart redis-server
   ```

### Logs Location

- **PM2 Logs**: `/opt/Bl-compiler/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `/var/log/syslog`
- **Docker Logs**: `docker-compose logs`

## 📈 Performance Optimization

### PM2 Optimization
```bash
# Scale API instances
pm2 scale api 4

# Scale worker instances
pm2 scale worker 2
```

### Nginx Optimization
- Enable gzip compression
- Configure caching headers
- Setup rate limiting
- Use HTTP/2

### Database Optimization
- Enable MongoDB indexes
- Configure Redis memory limits
- Setup database monitoring

## 🔒 Security Best Practices

1. **Use HTTPS** with valid SSL certificates
2. **Configure firewall** to restrict access
3. **Regular updates** of system packages
4. **Strong passwords** for all services
5. **Monitor logs** for suspicious activity
6. **Backup data** regularly
7. **Use environment variables** for secrets

## 📞 Support

For deployment issues:
1. Check logs first
2. Verify environment variables
3. Test individual services
4. Check network connectivity
5. Review security group settings

## 🎉 Success!

Once deployed, your application will be available at:
- **API**: `https://yourdomain.com/api`
- **Health Check**: `https://yourdomain.com/health`
- **Monitoring**: `https://yourdomain.com:3001` (if using Grafana)
