# Smart Classroom Utilization Tracker - Setup Guide

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Docker Desktop (or Docker Engine on Linux)
- [ ] Docker Compose v3.8+
- [ ] Node.js 18 LTS
- [ ] Python 3.9+
- [ ] Git
- [ ] 4GB+ RAM available
- [ ] 10GB+ free disk space
- [ ] Text editor (VS Code recommended)
- [ ] Terminal/Command Line access

### Verify Installation

```bash
docker --version      # Should show Docker version
docker-compose --version  # Should show Docker Compose version
node --version        # Should show Node.js version
python --version      # Should show Python 3.9+
```

---

## 🎯 Step-by-Step Setup

### Step 1: Clone/Download Project

```bash
# Using Git
git clone https://github.com/your-org/smart-classroom-tracker.git
cd smart-classroom-tracker

# Or download and extract ZIP
```

### Step 2: Create Environment File

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings
# On Windows:
notepad .env

# On Mac/Linux:
nano .env

# Required settings:
DB_PASSWORD=your_secure_password_123
JWT_SECRET_KEY=your_very_long_secret_key_min_32_chars
```

### Step 3: Install Dependencies (Optional)

For local development only:

```bash
# Backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# Admin frontend
cd frontend-admin
npm install
cd ..

# Staff frontend
cd frontend-staff
npm install
cd ..
```

### Step 4: Start Services with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### Step 5: Initialize Database

Wait for all services to be healthy (30-60 seconds):

```bash
# Verify database is running
docker-compose logs db

# Create default admin user
docker-compose exec backend python3 << 'EOF'
from app import app, db, User

with app.app_context():
    # Check if admin exists
    admin = User.query.filter_by(username='admin').first()
    if admin:
        print("Admin user already exists")
    else:
        admin = User(
            username='admin',
            email='admin@smartclassroom.local',
            role='admin',
            is_active=True
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("✓ Admin user created successfully!")
        print("  Username: admin")
        print("  Password: admin123")
EOF
```

### Step 6: Access Applications

Open in your browser:

| Application | URL | Username | Password |
|-------------|-----|----------|----------|
| Admin Dashboard | http://localhost:3000 | admin | admin123 |
| Staff Portal | http://localhost:3001 | - | - |
| API Documentation | http://localhost:5000 | - | - |

---

## 🔧 First-Time Configuration

### 1. Create Staff User

1. Open Admin Dashboard (http://localhost:3000)
2. Login with `admin` / `admin123`
3. Navigate to **User Management**
4. Click **+ Add User**
5. Fill in:
   - Username: `teacher1`
   - Email: `teacher1@school.edu`
   - Password: `temp_password_123`
   - Role: `Staff`
6. Click **Create User**

### 2. Register ESP Device

1. Navigate to **Device Management**
2. Click **+ Register Device**
3. Fill in:
   - Device ID: `CLASSROOM_001`
   - Device Name: `Main Hall Sensor`
   - Click **Generate** for API Key
   - MAC Address: (optional)
4. Click **Register Device**
5. **Copy the API Key** (you'll need it for ESP firmware)

### 3. Create Classroom

1. Navigate to **Classroom Management**
2. Click **+ Add Classroom**
3. Fill in:
   - Classroom Name: `Physics Lab`
   - Location: `Building A, Floor 2`
   - Capacity: `30`
   - Assign ESP Device: `CLASSROOM_001`
4. Click **Create Classroom**

### 4. Configure ESP Device (if you have hardware)

1. Flash `esp-firmware/esp_classroom_node.ino` to your ESP32/ESP8266
2. Edit these configuration lines:

```cpp
const char* WIFI_SSID = "Your_WiFi_Network";
const char* WIFI_PASSWORD = "Your_WiFi_Password";
const char* SERVER_URL = "http://192.168.1.100:5000";  // Your server IP
const char* DEVICE_ID = "CLASSROOM_001";
const char* API_KEY = "key_abc123...";  // From step 2
```

3. Upload to ESP device
4. Open Serial Monitor to verify connection

---

## 🧪 Testing the System

### Test 1: Login & Dashboard

```bash
# 1. Open Admin Dashboard
http://localhost:3000

# 2. Login with admin credentials
Username: admin
Password: admin123

# 3. Verify dashboard loads
# Should see statistics cards and classroom table
```

### Test 2: Create Booking

```bash
# 1. Staff login to Staff Portal
http://localhost:3001

# 2. Click "Book Classroom"

# 3. Select Physics Lab

# 4. Set time slot
Start: Tomorrow, 10:00 AM
End: Tomorrow, 11:30 AM

# 5. Add title: "Physics Practical"

# 6. Click "Confirm Booking"

# 7. Verify booking appears in "My Bookings"
```

### Test 3: API Call

```bash
# Get your JWT token first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Copy the "access_token" from response

# Get classrooms
curl -X GET http://localhost:5000/api/admin/classrooms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📱 ESP Device Simulation (Without Hardware)

If you don't have ESP hardware, simulate status updates:

```bash
# Get admin token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.access_token')

# Simulate ESP reporting occupied room
curl -X POST http://localhost:5000/api/esp/status \
  -H "Content-Type: application/json" \
  -H "X-Device-ID: CLASSROOM_001" \
  -H "X-API-Key: key_your_api_key_here" \
  -d '{
    "device_id": "CLASSROOM_001",
    "is_occupied": true,
    "is_power_on": true,
    "last_movement": 30,
    "temperature": 22.5,
    "timestamp": '$(date +%s)'
  }'

# Response should include is_booked status
```

---

## 🔍 Verification Checklist

After setup, verify:

- [ ] Docker containers running: `docker-compose ps`
- [ ] API responding: `curl http://localhost:5000/health`
- [ ] Admin dashboard loads: http://localhost:3000
- [ ] Staff portal loads: http://localhost:3001
- [ ] Can login as admin
- [ ] Can create users
- [ ] Can register devices
- [ ] Can create classrooms
- [ ] Database connected: `docker-compose logs db`

---

## 🐛 Common Issues & Fixes

### Port Already in Use

```bash
# If port 5000 is in use
# Option 1: Change in docker-compose.yml
# Change "5000:5000" to "5001:5000"

# Option 2: Kill process using port
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :5000
kill -9 <PID>
```

### Database Connection Error

```bash
# Reset database
docker-compose down
docker volume rm smart-classroom-utilization-tracker_postgres_data
docker-compose up -d
```

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose up --build -d

# Check Docker daemon
docker ps
```

### Can't Access http://localhost:3000

```bash
# Verify container is running
docker-compose ps admin-frontend

# Check logs
docker-compose logs admin-frontend

# Ensure Node dependencies installed
docker-compose exec admin-frontend npm install
```

---

## 🚀 Next Steps

After successful setup:

1. **Configure Timezone**
   - Edit `.env` file
   - Set `TZ=Your/Timezone`

2. **Enable HTTPS**
   - See `docs/DEPLOYMENT.md`
   - Generate SSL certificates

3. **Add ESP Devices**
   - Flash firmware to all devices
   - Register each in admin panel

4. **Create Booking Schedule**
   - Add regular bookings for testing
   - Verify auto-power-off logic

5. **Set Up Backups**
   - Configure database backups
   - Store backups securely

6. **Monitor System**
   - Check logs regularly
   - Monitor resource usage
   - Review contact messages

---

## 📚 Additional Resources

- **API Documentation**: See `docs/API.md`
- **Deployment Guide**: See `docs/DEPLOYMENT.md`
- **Architecture**: See `docs/ARCHITECTURE.md`
- **ESP Firmware**: See `esp-firmware/esp_classroom_node.ino`
- **Database Schema**: See `database/schema.sql`

---

## 🆘 Get Help

**Issues with Docker**:
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Guide](https://docs.docker.com/compose/)

**Issues with React**:
- [React Documentation](https://react.dev/)
- [React Hooks Guide](https://react.dev/reference/react)

**Issues with Flask**:
- [Flask Documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy Guide](https://docs.sqlalchemy.org/)

**Issues with ESP**:
- [Arduino IDE Guide](https://docs.arduino.cc/software/ide-v2)
- [ESP32 Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/)

---

## 📝 Notes

- Default passwords should be changed immediately
- JWT_SECRET_KEY must be at least 32 characters
- Database backups are essential
- Keep system and dependencies updated
- Monitor logs for errors

---

**Setup Guide Version**: 1.0  
**Last Updated**: January 28, 2026  
**Estimated Setup Time**: 15-30 minutes
