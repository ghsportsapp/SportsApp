#! /bin/bash
set -e  # Exit on any error

# === Variables ===
DOCKER_IMAGE="shahedtalukder32/sportsapp:latest"
DOMAIN="sportsapp.in"
EMAIL="admin@evolvesnacks.com" # for SSL certificate

# === 1. Install Docker ===
apt-get update
apt-get install -y docker.io

# Start Docker service
systemctl enable docker
systemctl start docker

# Add current user to docker group and fix permissions
usermod -aG docker $USER || true
chmod 666 /var/run/docker.sock

# Wait for Docker to be fully ready
sleep 5

# === 2. Run your Docker container ===
docker pull $DOCKER_IMAGE
docker run -d --name my-app -p 3000:3000 $DOCKER_IMAGE

# === 3. Install NGINX ===
apt-get install -y nginx

# === 4. Configure NGINX as reverse proxy ===
cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Reload NGINX with new config
nginx -t && systemctl reload nginx

# === 5. Install Certbot & Configure SSL ===
apt-get install -y certbot python3-certbot-nginx

# Issue certificate & configure HTTPS
certbot --nginx --non-interactive --agree-tos -m $EMAIL -d $DOMAIN

