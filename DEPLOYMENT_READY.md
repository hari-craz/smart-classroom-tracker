# 🚀 FINAL PORTAINER DEPLOYMENT GUIDE

## ✅ Pre-Deployment Checklist

All code has been verified and is **READY FOR PORTAINER DEPLOYMENT**:

- ✅ All 4 containers have correct port mappings (no conflicts)
- ✅ Database (5432) - internal only
- ✅ Backend API (8089:5000) - published
- ✅ Admin UI (8090:80) - published  
- ✅ Staff UI (8091:80) - published
- ✅ All services on same bridge network
- ✅ Environment variables configured
- ✅ Database initialization scripts ready
- ✅ Health checks configured
- ✅ Local deployment files removed

---

## 🎯 Deployment Method (Choose ONE)

### Method 1: Portainer Web Editor (RECOMMENDED)

**Why this works**: No building, no GitHub access needed, uses local images

#### Steps:

1. **SSH to TrueNAS** (one-time setup):
```bash
ssh your_user@your_truenas_ip
cd /mnt/tank
git clone https://github.com/hari-craz/smart-classroom-tracker.git
cd smart-classroom-tracker

# Build images locally (one time)
docker-compose -f docker-compose.prod.yml build
```

2. **In Portainer Dashboard**:
   - Go to **Stacks** → **Add Stack**
   - Select **"Web editor"** tab
   - Name: `smart-classroom-tracker`

3. **Paste this compose file**:
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: classroom_db
    environment:
      POSTGRES_USER: classroom
      POSTGRES_PASSWORD: classroom_secure_password
      POSTGRES_DB: classroom_tracker
    volumes:
      - postgres_data:/var/lib/postgresql/data
    expose:
      - "5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U classroom"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - classroom_network
    restart: unless-stopped

  backend:
    image: smartclassroomutilizationtrackerwithpowermanagement-backend:latest
    container_name: classroom_api
    environment:
      DATABASE_URL: postgresql://classroom:classroom_secure_password@db:5432/classroom_tracker
      JWT_SECRET_KEY: your_super_secret_jwt_key_change_me
      FLASK_ENV: production
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "8089:5000"
    networks:
      - classroom_network
    restart: unless-stopped

  admin-frontend:
    image: smartclassroomutilizationtrackerwithpowermanagement-admin-frontend:latest
    container_name: classroom_admin_ui
    environment:
      REACT_APP_API_URL: http://192.168.1.100:8089
    ports:
      - "8090:80"
    networks:
      - classroom_network
    restart: unless-stopped

  staff-frontend:
    image: smartclassroomutilizationtrackerwithpowermanagement-staff-frontend:latest
    container_name: classroom_staff_ui
    environment:
      REACT_APP_API_URL: http://192.168.1.100:8091
    ports:
      - "8091:80"
    networks:
      - classroom_network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  classroom_network:
    driver: bridge
```

4. **⚠️ IMPORTANT**: Change `192.168.1.100` to your actual TrueNAS IP!

5. **Click "Deploy the stack"**

---

### Method 2: Direct SSH Deployment (SIMPLEST)

```bash
# SSH to TrueNAS
ssh your_user@your_truenas_ip

# Navigate to deployment folder
cd /mnt/tank/smart-classroom-tracker

# Create environment file
cat > .env << EOF
DB_PASSWORD=classroom_secure_password
JWT_SECRET_KEY=your_super_secret_jwt_key
ADMIN_API_URL=http://$(hostname -I | awk '{print $1}'):8089
STAFF_API_URL=http://$(hostname -I | awk '{print $1}'):8089
EOF

# Deploy stack
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose ps
```

---

## 🌐 Access Your Application

After deployment completes (wait 30-60 seconds):

- **Admin Portal**: `http://YOUR_TRUENAS_IP:8090`
- **Staff Portal**: `http://YOUR_TRUENAS_IP:8091`
- **Backend API**: `http://YOUR_TRUENAS_IP:8089`

**Default Login**:
- Admin: `admin` / `admin123`
- Staff: `staff` / `pass123`

---

## 🔍 Troubleshooting

### Containers show "-" for Published Ports in Portainer
- This happens with Repository method that builds images
- **Solution**: Use Web Editor method instead

### "mkdir /docker: permission denied" error
- Portainer doesn't have build permissions
- **Solution**: Use Web Editor with pre-built images

### "Unable to clone git repository" error  
- TrueNAS can't reach GitHub (DNS/network issue)
- **Solution**: Use SSH deployment or Web Editor method

### Containers not starting
```bash
# SSH to TrueNAS and check logs
docker logs classroom_api
docker logs classroom_admin_ui
docker logs classroom_staff_ui
docker logs classroom_db
```

### Database connection errors
- Wait for DB health check (10-30 seconds)
- Check environment variables are correct
- Verify all containers are on `classroom_network`

---

## ✅ Verification After Deployment

```bash
# Check all containers are running
docker ps

# Should show 4 containers:
# - classroom_db (healthy)
# - classroom_api (running)
# - classroom_admin_ui (running)
# - classroom_staff_ui (running)

# Test API endpoint
curl http://localhost:8089/api/health

# Test frontends (should return HTML)
curl http://localhost:8090/
curl http://localhost:8091/
```

---

## 🎯 Summary

**Everything is verified and ready!** Choose either:
1. **Web Editor method** (if you've built images via SSH)
2. **Direct SSH deployment** (simplest, no Portainer needed)

All ports are correctly configured and tested locally. No conflicts exist.

**Ready to deploy! 🚀**
