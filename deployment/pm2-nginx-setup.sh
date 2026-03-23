#!/bin/bash

set -e

echo "🚀 Setting up B with PM2 + Nginx..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 globally
npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod

# Install Git
sudo apt install -y git

# Install UFW (firewall)
sudo apt install -y ufw
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create application directory
sudo mkdir -p /opt/placevalue
sudo chown $USER:$USER /opt/placevalue

echo " System setup complete!"
echo " Next steps:"
echo "1. Clone your repository to /opt/placevalue"
echo "2. Run: ./deployment/pm2-deploy.sh"
echo "3. Configure your domain and SSL"
