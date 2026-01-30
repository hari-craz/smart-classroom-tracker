#!/bin/bash

# Deployment script for Smart Classroom Tracker on TrueNAS
# Run this script on TrueNAS to deploy the application

echo "================================"
echo "Smart Classroom Tracker Deployment"
echo "================================"

# Set working directory
WORK_DIR="/mnt/tank/smart-classroom-tracker"
mkdir -p $WORK_DIR
cd $WORK_DIR

# Step 1: Clone repository
echo ""
echo "[1] Cloning repository..."
if [ -d ".git" ]; then
    git pull origin main
else
    git clone https://github.com/hari-craz/smart-classroom-tracker.git .
fi

# Step 2: Load Docker images
echo ""
echo "[2] Loading Docker images..."
if [ -f "backend-image.tar" ]; then
    echo "Loading backend image..."
    docker load -i backend-image.tar
fi

if [ -f "admin-frontend-image.tar" ]; then
    echo "Loading admin frontend image..."
    docker load -i admin-frontend-image.tar
fi

if [ -f "staff-frontend-image.tar" ]; then
    echo "Loading staff frontend image..."
    docker load -i staff-frontend-image.tar
fi

# Step 3: Create environment file
echo ""
echo "[3] Creating .env file..."
cat > .env << EOF
DB_PASSWORD=classroom_secure_password
JWT_SECRET_KEY=your_super_secret_jwt_key_change_this_in_production
ADMIN_API_URL=http://$(hostname -I | awk '{print $1}'):8089
STAFF_API_URL=http://$(hostname -I | awk '{print $1}'):8089
EOF

# Step 4: Deploy stack
echo ""
echo "[4] Deploying Docker stack..."
docker-compose -f docker-compose.prod.portainer.yml down 2>/dev/null
docker-compose -f docker-compose.prod.portainer.yml up -d

# Step 5: Verify deployment
echo ""
echo "[5] Verifying deployment..."
sleep 5

echo ""
echo "================================"
echo "Deployment Complete!"
echo "================================"
docker-compose -f docker-compose.prod.portainer.yml ps

# Get IP address for access
IP=$(hostname -I | awk '{print $1}')
echo ""
echo "Access your application at:"
echo "  Admin Portal:  http://$IP:8090"
echo "  Staff Portal:  http://$IP:8091"
echo "  API Endpoint:  http://$IP:8089"
echo ""
echo "Default credentials:"
echo "  Admin: admin / admin123"
echo "  Staff: newstaff / pass123"
echo ""
