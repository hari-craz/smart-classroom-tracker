# Smart Classroom Utilization Tracker - Deployment Guide

## System Requirements

- Docker & Docker Compose installed
- TrueNAS SCALE or any Linux server with Docker
- Minimum 4GB RAM, 2 CPU cores
- 10GB free disk space
- Static IP address for the server
- Open ports: 5000 (API), 3000 (Admin UI), 3001 (Staff UI), 80 (HTTP), 443 (HTTPS)

## Pre-Deployment Setup

### 1. Clone or Copy Project Files

```bash
cd /path/to/deployment
cp -r smart-classroom-utilization-tracker .
cd smart-classroom-utilization-tracker
```

### 2. Configure Environment Variables

Create `.env` file in the root directory:

```bash
# Database Configuration
DB_PASSWORD=your_secure_db_password_here

# JWT Configuration
JWT_SECRET_KEY=your_very_secure_jwt_secret_key_change_this

# API URLs
ADMIN_API_URL=https://your-server-ip:443/api
STAFF_API_URL=https://your-server-ip:443/api

# Flask Settings
FLASK_ENV=production
```

### 3. Initialize Frontend Applications

Before starting containers, install dependencies:

```bash
# Admin Frontend
cd frontend-admin
npm install
cd ..

# Staff Frontend
cd frontend-staff
npm install
cd ..
```

## Deployment on TrueNAS SCALE

### Option A: Using Docker Compose (Recommended)

1. **Copy project to TrueNAS**
```bash
scp -r ./smart-classroom-utilization-tracker root@192.168.1.100:/mnt/tank/apps/
```

2. **SSH into TrueNAS and start containers**
```bash
ssh root@192.168.1.100
cd /mnt/tank/apps/smart-classroom-utilization-tracker
docker-compose up -d
```

3. **Verify deployment**
```bash
docker-compose ps
docker-compose logs -f backend
```

### Option B: Using TrueNAS Apps

1. In TrueNAS Web UI, go to: **Apps > Available Applications**
2. Search for "Docker Compose"
3. Install and configure with custom docker-compose.yml
4. Mount volumes from TrueNAS storage

## Post-Deployment Configuration

### 1. Initialize Database

The database schema will auto-initialize on first run. Create the default admin user:

```bash
docker exec -it classroom_api python3 -c "
from app import app, db, User

with app.app_context():
    admin = User(
        username='admin',
        email='admin@smartclassroom.local',
        role='admin',
        is_active=True
    )
    admin.set_password('admin123')
    db.session.add(admin)
    db.session.commit()
    print('Admin user created successfully')
"
```

### 2. Configure Reverse Proxy (Nginx)

Create `nginx/nginx.conf`:

```nginx
upstream backend {
    server backend:5000;
}

upstream admin_frontend {
    server admin-frontend:3000;
}

upstream staff_frontend {
    server staff-frontend:3000;
}

server {
    listen 80;
    server_name your-server-ip;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-server-ip;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin Dashboard
    location /admin/ {
        proxy_pass http://admin_frontend/;
        proxy_set_header Host $host;
    }

    # Staff Portal
    location / {
        proxy_pass http://staff_frontend/;
        proxy_set_header Host $host;
    }
}
```

### 3. Configure SSL Certificates

Generate self-signed certificates:

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

## ESP Device Configuration

### 1. Flash Firmware to ESP32/ESP8266

1. Download Arduino IDE: https://www.arduino.cc/en/software
2. Install ESP32/ESP8266 board support
3. Open `esp-firmware/esp_classroom_node.ino`
4. Configure WiFi and server details:

```cpp
const char* WIFI_SSID = "Your_Network_SSID";
const char* WIFI_PASSWORD = "Your_WiFi_Password";
const char* SERVER_URL = "http://192.168.1.100:5000";
const char* DEVICE_ID = "CLASSROOM_001";
const char* API_KEY = "generated_api_key";
```

5. Upload to ESP device

### 2. Register Device in Admin Panel

1. Open Admin Dashboard: `https://your-server-ip/admin/`
2. Navigate to **Device Management**
3. Click **+ Register Device**
4. Fill in:
   - Device ID: `CLASSROOM_001`
   - Device Name: `Main Hall ESP32`
   - API Key: (same as in firmware)
   - MAC Address: (optional)
5. Click **Register Device**

### 3. Assign Device to Classroom

1. Go to **Classroom Management**
2. Create a new classroom or edit existing
3. Select the device in **Assign ESP Device**
4. Save

## Maintenance

### Backup Database

```bash
docker exec classroom_db pg_dump -U classroom classroom_tracker > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
docker exec -i classroom_db psql -U classroom classroom_tracker < backup_20260128_120000.sql
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f admin-frontend
```

### Update System

```bash
cd /path/to/smart-classroom-utilization-tracker
docker-compose pull
docker-compose up -d
```

## Troubleshooting

### Database Connection Error

```bash
docker-compose down
docker volume rm smart-classroom-utilization-tracker_postgres_data
docker-compose up -d
```

### Port Already in Use

Change ports in `docker-compose.yml`:

```yaml
backend:
  ports:
    - "5001:5000"  # Change external port
```

### ESP Device Not Connecting

1. Verify WiFi connectivity
2. Check server URL is accessible from ESP network
3. Verify Device ID and API Key match
4. Check device logs in Admin Dashboard

### Reverse Proxy Issues

```bash
# Test Nginx configuration
docker exec classroom_proxy nginx -t

# Reload Nginx
docker exec classroom_proxy nginx -s reload
```

## Security Hardening

1. **Change default admin password** after first login
2. **Use strong JWT_SECRET_KEY** (minimum 32 characters)
3. **Enable HTTPS with valid certificates**
4. **Restrict API access by IP** in Nginx
5. **Use VPN for remote access**
6. **Enable database backups**
7. **Monitor logs regularly**

## Performance Optimization

### For Large Deployments

1. Increase worker processes in `docker-compose.yml`:

```yaml
backend:
  environment:
    GUNICORN_WORKERS: 8
```

2. Enable database connection pooling:

```python
# In backend/app.py
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 20,
    'pool_recycle': 3600,
    'pool_pre_ping': True,
}
```

3. Add Redis for caching:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

## Support & Monitoring

- Monitor dashboard: Admin panel shows real-time status
- Enable logging to file for audit trail
- Set up email alerts for critical errors
- Regular database maintenance and indexing

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TrueNAS SCALE                         │
├─────────────────────────────────────────────────────────┤
│  Docker Network                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Nginx    │  │ Backend  │  │ PostgreSQL              │
│  │ Proxy    │  │ API      │  │ Database               │
│  └────┬─────┘  └────┬─────┘  └──────────┘              │
│       │             │                                   │
│  ┌────┴──────┐  ┌───┴─────┐                           │
│  │ Admin UI  │  │Staff UI  │                           │
│  │ :3000     │  │ :3001    │                           │
│  └───────────┘  └──────────┘                           │
└─────────────────────────────────────────────────────────┘
       ↑
       │
    Ports: 80, 443
    
ESP Devices ←→ Backend API (Port 5000)
```

## Network Security

### Firewall Rules (Example)

```bash
# Allow only specific IPs to access API
iptables -A INPUT -p tcp --dport 5000 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 5000 -j DROP

# Allow public HTTPS access
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

---

**Last Updated**: January 2026
**Version**: 1.0
