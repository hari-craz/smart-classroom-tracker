# Deploy Smart Classroom Tracker to Portainer on TrueNAS

## Option 1: Use SSH Deployment (Recommended)

### Prerequisites:
- SSH access to TrueNAS
- Docker and Docker Compose installed on TrueNAS

### Steps:

1. **SSH into TrueNAS**:
```bash
ssh your_truenas_user@your_truenas_ip
```

2. **Create deployment directory**:
```bash
mkdir -p /mnt/tank/smart-classroom-tracker
cd /mnt/tank/smart-classroom-tracker
```

3. **Clone the repository**:
```bash
git clone https://github.com/hari-craz/smart-classroom-tracker.git .
```

4. **Create environment file**:
```bash
cat > .env << EOF
DB_PASSWORD=classroom_secure_password
JWT_SECRET_KEY=your_super_secret_jwt_key_change_this
ADMIN_API_URL=http://YOUR_TRUENAS_IP:8089
STAFF_API_URL=http://YOUR_TRUENAS_IP:8089
EOF
```

Replace `YOUR_TRUENAS_IP` with your actual TrueNAS IP.

5. **Deploy using Docker Compose**:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

6. **Verify deployment**:
```bash
docker-compose ps
```

---

## Option 2: Use Portainer with Web Editor

### Steps:

1. **In Portainer Dashboard** → **Stacks** → **Add Stack**

2. **Select "Web editor" tab**

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
      JWT_SECRET_KEY: your_super_secret_jwt_key
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
      REACT_APP_API_URL: http://YOUR_TRUENAS_IP:8089
    ports:
      - "8090:80"
    networks:
      - classroom_network
    restart: unless-stopped

  staff-frontend:
    image: smartclassroomutilizationtrackerwithpowermanagement-staff-frontend:latest
    container_name: classroom_staff_ui
    environment:
      REACT_APP_API_URL: http://YOUR_TRUENAS_IP:8089
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

4. **Click "Deploy the stack"**

---

## Troubleshooting

### Error: "mkdir /docker: permission denied"
- Use Option 1 (SSH deployment) instead
- This error occurs when Portainer tries to build images without proper permissions

### Images not found
- Make sure to build images first locally:
  ```bash
  docker-compose build
  ```
- Or use SSH deployment which automatically builds them

### Cannot access the application
- Wait 30 seconds for containers to start
- Check firewall allows ports 8089, 8090, 8091
- Verify containers are healthy in Portainer

---

## Access URLs

Once deployed:
- **Admin Portal**: http://YOUR_TRUENAS_IP:8090
- **Staff Portal**: http://YOUR_TRUENAS_IP:8091
- **API**: http://YOUR_TRUENAS_IP:8089

**Default Credentials**:
- Admin: `admin` / `admin123`
- Staff: `newstaff` / `pass123`
