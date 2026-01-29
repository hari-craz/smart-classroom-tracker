# Smart Classroom Utilization Tracker - README

A comprehensive IoT-based solution for tracking classroom utilization and automating electricity management using ESP microcontrollers, a centralized server, and web dashboards.

## 🎯 Features

### Core Functionality
- ✅ **Real-time Occupancy Monitoring**: Ultrasonic sensors detect room movement
- ✅ **Automatic Power Management**: Auto-cut electricity when room is idle and not booked
- ✅ **Booking System**: Staff can book classrooms with time-based slots
- ✅ **Role-Based Access**: Admin and Staff portals with different capabilities
- ✅ **Live Dashboard**: Real-time status updates and control
- ✅ **Energy Optimization**: Reduce electricity wastage significantly

### Technical Features
- 🔐 JWT-based authentication
- 🛡️ Role-based access control (RBAC)
- 📱 Responsive web interfaces
- 🐳 Docker containerization
- 📊 Historical data logging and analytics
- 🔄 RESTful API design
- 🌐 Multi-device support

## 📁 Project Structure

```
smart-classroom-utilization-tracker/
├── esp-firmware/
│   └── esp_classroom_node.ino          # ESP32/ESP8266 firmware
├── backend/
│   ├── app.py                          # Flask API server
│   ├── requirements.txt                # Python dependencies
│   ├── Dockerfile                      # Backend container
│   └── .env.example                    # Environment template
├── frontend-admin/
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/                      # Admin pages
│   │   └── styles/                     # CSS files
│   └── package.json
├── frontend-staff/
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/                      # Staff pages
│   │   └── styles/                     # CSS files
│   └── package.json
├── database/
│   └── schema.sql                      # PostgreSQL schema
├── docs/
│   ├── DEPLOYMENT.md                   # Deployment guide
│   ├── API.md                          # API documentation
│   └── ARCHITECTURE.md                 # System architecture
└── docker-compose.yml                  # Multi-container orchestration
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)
- ESP32 or ESP8266 microcontroller
- Ultrasonic sensor (HC-SR04)
- 5V Relay module

### One-Command Deployment

```bash
# Clone repository
git clone https://github.com/your-org/smart-classroom-tracker.git
cd smart-classroom-tracker

# Create environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Access dashboards
# Admin: http://localhost:3000
# Staff: http://localhost:3001
# API: http://localhost:5000
```

### Default Credentials

- **Admin Username**: `admin`
- **Admin Password**: `admin123`
- **Admin Dashboard**: http://localhost:3000

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Admin APIs
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `DELETE /api/admin/users/<id>` - Delete user
- `GET /api/admin/devices` - List devices
- `POST /api/admin/devices` - Register device
- `GET /api/admin/classrooms` - List classrooms
- `POST /api/admin/classrooms` - Create classroom
- `POST /api/admin/power/<id>` - Control power

### Staff APIs
- `GET /api/staff/classrooms` - Get available classrooms
- `GET /api/staff/bookings` - Get user bookings
- `POST /api/staff/bookings` - Create booking

### ESP Device APIs
- `POST /api/esp/status` - Report room status
- `POST /api/esp/power-log` - Log power changes

See [API.md](docs/API.md) for detailed documentation.

## 🔧 System Architecture

```
┌─────────────────────────────────────────┐
│          TrueNAS SCALE SERVER           │
├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐   │
│  │  Docker Containers               │   │
│  │  ┌────────┐ ┌─────────┐ ┌──────┐ │   │
│  │  │ Nginx  │ │ Backend │ │  DB  │ │   │
│  │  │ Proxy  │ │  API    │ │(PG)  │ │   │
│  │  └────────┘ └─────────┘ └──────┘ │   │
│  │  ┌─────────────────────────────┐ │   │
│  │  │ Admin UI & Staff Portal     │ │   │
│  │  └─────────────────────────────┘ │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
         ↑
         │ WiFi/LAN
         │
    ┌────┴────┬──────────┬──────────┐
    │          │          │          │
 ┌──┴──┐   ┌──┴──┐   ┌──┴──┐   ┌──┴──┐
 │ESP32│   │ESP32│   │ESP32│   │ESP32│
 │(RM) │   │(Lab)│   │(Gym)│   │(Hall)
 └─────┘   └─────┘   └─────┘   └─────┘
   ↓         ↓         ↓         ↓
┌─────────────────────────────────────┐
│ Ultrasonic Sensors + Relay Modules  │
└─────────────────────────────────────┘
```

## 🔐 Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt with salt
- **Role-Based Access**: Admin/Staff separation
- **Device Authentication**: API Key + Device ID
- **HTTPS/SSL**: Supported via reverse proxy
- **Database Encryption**: Optional field-level encryption

## 📊 Database Schema

- **Users**: User accounts with roles
- **ESP Devices**: Registered IoT devices
- **Classrooms**: Room definitions
- **Room Status**: Real-time occupancy & power state
- **Bookings**: Room reservations
- **Status Logs**: Historical occupancy data
- **Power Logs**: Power control audit trail
- **Contact Messages**: User feedback

See [schema.sql](database/schema.sql) for details.

## 📱 User Interfaces

### Admin Dashboard
- User management
- Device registration & assignment
- Classroom configuration
- Real-time power control
- System statistics

### Staff Portal
- View available classrooms
- Create room bookings
- Manage personal bookings
- Manual power override (for booked rooms)
- Contact support

## 🔌 ESP Firmware

Features:
- Ultrasonic-based motion detection
- Configurable timing values
- Secure API communication
- Relay control (ON/OFF)
- Fail-safe logic (never cut power during booking)
- WiFi auto-reconnect

See [esp_classroom_node.ino](esp-firmware/esp_classroom_node.ino) for configuration.

## 🚢 Deployment

### TrueNAS SCALE Deployment

```bash
# Full deployment guide
See docs/DEPLOYMENT.md

# Quick commands
docker-compose up -d          # Start services
docker-compose logs -f        # View logs
docker-compose down           # Stop services
```

### Development Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
export FLASK_ENV=development
python app.py

# Admin Frontend
cd frontend-admin
npm install
npm start

# Staff Frontend
cd frontend-staff
npm install
npm start
```

## 🛠️ Customization

### Modify Timings (ESP Firmware)

```cpp
const int MOVEMENT_TIMEOUT = 60;        // 1 minute idle
const int POWER_OFF_DELAY = 180;        // 3 minutes power-off
const int IDLE_REPORT_INTERVAL = 120;   // 2 minutes status report
```

### Change Detection Threshold

```cpp
const float MOTION_DETECTION_THRESHOLD = 50;  // cm
```

### Add Temperature Sensor

Integrate with DHT22, DS18B20, or BME680 sensors.

## 📈 Scalability

- Supports 100+ classrooms per deployment
- Handles 1000+ concurrent bookings
- Stores years of historical data
- Horizontal scaling via Kubernetes ready

## 🐛 Troubleshooting

### ESP Won't Connect
1. Check WiFi credentials
2. Verify server URL is accessible
3. Confirm Device ID and API Key

### Booking Conflicts
1. Check overlapping bookings
2. Verify system time is synced
3. Clear booking cache

### Power Control Not Working
1. Verify relay wiring
2. Check GPIO pin configuration
3. Test relay with multimeter

See [DEPLOYMENT.md](docs/DEPLOYMENT.md#troubleshooting) for more.

## 📝 Automation Rules

### Automatic Power OFF
- Room is idle (no movement for 1 minute)
- Room is NOT booked
- Wait 3 minutes before cutting power

### Automatic Power ON
- New booking is created
- OR admin manually enables

### Power Never Cuts During
- Active bookings
- Booked time slots
- When admin has override enabled

## 🔄 Status Report Cycle

```
1. ESP detects movement → Reset idle timer
2. After movement timeout → Mark room idle
3. Every 2 minutes → Send status to server
4. Server checks if booked → Return booking status
5. Server calculates auto-off → Return power command
6. ESP applies command → Toggle relay
7. ESP logs power change → Send to server
```

## 📊 Analytics & Reports

- Room utilization statistics
- Peak usage hours
- Energy consumption tracking
- Booking trends
- Device performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👨‍💼 Support & Contact

- **Email**: support@smartclassroom.local
- **Documentation**: See `docs/` folder
- **Issue Tracker**: GitHub Issues
- **Contact Form**: Available in Staff Portal

## 🎓 Educational Use

This project is designed as an educational tool for:
- IoT development
- Web application design
- Database architecture
- Docker containerization
- REST API design
- Smart building systems

## 🗺️ Future Enhancements

- [ ] Mobile app for bookings
- [ ] Webhook notifications
- [ ] Advanced analytics dashboard
- [ ] MQTT protocol support
- [ ] Multi-site management
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Energy billing reports
- [ ] Predictive analytics
- [ ] Voice control integration

## 📦 Version Info

- **Version**: 1.0.0
- **Release Date**: January 28, 2026
- **Status**: Production Ready

---

**Built with ❤️ for smarter classrooms**
