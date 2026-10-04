#!/bin/bash
# ============================================
# Jerney Blog Platform - EC2 Setup Script
# Run this script on a fresh Ubuntu EC2 instance
# ============================================

set -e

echo "🛤️  Setting up Jerney Blog Platform..."
echo "==========================================="

# --- Update system ---
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# --- Install Node.js 20.x ---
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# --- Install PostgreSQL ---
echo "📦 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# --- Install Nginx ---
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# --- Install PM2 (process manager) ---
echo "📦 Installing PM2..."
sudo npm install -g pm2

# --- Configure PostgreSQL ---
echo "🗄️  Configuring PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE USER jerney_user WITH PASSWORD 'jerney_pass_2026';
CREATE DATABASE jerney_db OWNER jerney_user;
GRANT ALL PRIVILEGES ON DATABASE jerney_db TO jerney_user;
\c jerney_db
GRANT ALL ON SCHEMA public TO jerney_user;
EOF

echo "✅ PostgreSQL configured"

# --- Set up project directory ---
echo "📁 Setting up project..."
sudo mkdir -p /var/www/jerney
sudo chown -R $USER:$USER /var/www/jerney

# Copy project files (assumes you've transferred them to ~/Jerney)
cp -r ~/Jerney/* /var/www/jerney/

# --- Install backend dependencies ---
echo "📦 Installing backend dependencies..."
cd /var/www/jerney/backend
npm install --production

# --- Build frontend ---
echo "🔨 Building frontend..."
cd /var/www/jerney/frontend
npm install
npm run build

# --- Configure Nginx ---
echo "🌐 Configuring Nginx..."
sudo cp /var/www/jerney/deploy/jerney-nginx.conf /etc/nginx/sites-available/jerney
sudo ln -sf /etc/nginx/sites-available/jerney /etc/nginx/sites-enabled/jerney
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# --- Start backend with PM2 ---
echo "🚀 Starting backend with PM2..."
cd /var/www/jerney/backend
pm2 start src/index.js --name jerney-backend
pm2 save
pm2 startup systemd -u $USER --hp /home/$USER | tail -1 | sudo bash

echo ""
echo "==========================================="
echo "🎉 Jerney is now live!"
echo "==========================================="
echo ""
echo "Access your blog at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo '<your-ec2-public-ip>')"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check backend status"
echo "  pm2 logs            - View backend logs"
echo "  pm2 restart all     - Restart backend"
echo "  sudo systemctl restart nginx - Restart Nginx"
echo ""
