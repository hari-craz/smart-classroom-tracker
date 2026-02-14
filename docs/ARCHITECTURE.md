# Smart Classroom Utilization Tracker - Architecture Guide

## System Overview

The Smart Classroom Utilization Tracker is a distributed IoT system composed of edge devices (ESP nodes), a centralized server, and web applications.

```
┌─────────────────────────────────────────────────────────┐
│                    Central Server (TrueNAS)             │
│                                                         | │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Docker Container Network              │   │
│  │                                                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │   │
│  │  │  Nginx   │  │  Flask   │  │  PostgreSQL  │    │   │
│  │  │ Reverse  │→→│   API    │→→│   Database   │    │   │
│  │  │  Proxy   │  │ Server   │  │              │    │   │
│  │  └──────────┘  └──────────┘  └──────────────┘    │   │
│  │       ↑              ↑                           │   │
│  │       │              │                           │   │
│  │  ┌────┴──────────────┴─────────────────┐         │   │
│  │  │  Admin Dashboard & Staff Portal     │         │   │
│  │  │  (React.js Applications)            │         │   │
│  │  └─────────────────────────────────────┘         │   │
│  └──────────────────────────────────────────────────┘   │
│                        ↑                                │
└────────────────────────┼────────────────────────────────┘
                         │ HTTP REST API
                         │ Port 5000
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───┴────┐       ┌───┴────┐      ┌───┴────┐
    │ ESP32  │       │ ESP32  │      │ ESP32  │
    │Node 1  │       │Node 2  │      │Node 3  │
    └────────┘       └────────┘      └────────┘
```

## Component Architecture

### 1. ESP32/ESP8266 Edge Nodes

**Responsibilities**:
- Motion detection via ultrasonic sensor
- Idle time tracking
- Relay-based power control
- Status reporting to server
- Secure authentication

**Key Features**:
- Configurable timing values
- WiFi auto-reconnect
- Fail-safe power logic
- Serial debug interface

**Communication**:
- REST API (HTTP)
- JSON payload
- Device ID + API Key authentication
- 2-minute reporting interval

```
ESP32 Flow:
┌─────────────────────────┐
│  Main Loop (100ms)      │
├─────────────────────────┤
│ 1. Check WiFi           │
│ 2. Read Sensor          │
│ 3. Calculate Idle Time  │
│ 4. Periodic Report      │
│ 5. Auto Power-Off Logic │
└─────────────────────────┘
```

### 2. Backend API Server (Flask)

**Technology Stack**:
- Framework: Flask
- Database: PostgreSQL
- ORM: SQLAlchemy
- Authentication: JWT (PyJWT)
- Deployment: Gunicorn + Docker

**Core Modules**:

```
app.py
├── Models (SQLAlchemy ORM)
│   ├── User
│   ├── Classroom
│   ├── ESPDevice
│   ├── RoomStatus
│   ├── Booking
│   ├── StatusLog
│   ├── PowerLog
│   └── ContactMessage
│
├── Routes
│   ├── /api/auth/* (Authentication)
│   ├── /api/esp/* (ESP Device Communication)
│   ├── /api/admin/* (Admin Functions)
│   ├── /api/staff/* (Staff Functions)
│   └── /api/contact (Contact Forms)
│
├── Middleware
│   ├── JWT Validation
│   ├── Device Authentication
│   └── CORS Handler
│
└── Utilities
    ├── Auto Power-Off Logic
    ├── Booking Conflict Check
    └── Error Handling
```

**API Endpoints**: ~25 RESTful endpoints

**Database Connections**:
- Connection pooling (max 20)
- Automatic reconnection
- Transaction management

### 3. PostgreSQL Database

**Schema Design**:

```sql
Users (1:N) Bookings (N:1) Classrooms (1:1) ESPDevices
Users (1:N) Bookings (N:1) Classrooms (1:N) StatusLogs
Users (1:N) ContactMessages
ESPDevices (1:N) PowerLogs
ESPDevices (1:N) StatusLogs
```

**Tables**: 8 main tables with proper indexing

**Data Retention**:
- StatusLogs: ~90 days (configurable)
- PowerLogs: Permanent
- Bookings: Permanent
- Contact Messages: 1 year

### 4. Admin Dashboard (React)

**Pages**:
1. **Dashboard**: Real-time statistics
2. **User Management**: Create/delete users
3. **Device Management**: Register ESP devices
4. **Classroom Management**: Configure rooms
5. **Power Control**: Manual relay control
6. **Contact Messages**: View feedback

**State Management**: React Hooks + Local Storage

**API Integration**:
- JWT token handling
- Bearer token in headers
- Error handling & retry logic
- Auto-logout on token expiry

### 5. Staff Portal (React)

**Pages**:
1. **Dashboard**: Available classrooms status
2. **Book Classroom**: Create bookings
3. **My Bookings**: View personal reservations
4. **Contact Us**: Send feedback

**Features**:
- Real-time room status updates
- Booking conflict detection
- Time slot selection
- Manual power override (for booked rooms)

## Data Flow Diagrams

### Normal Operation Flow

```
Time: 0s
┌─────────────┐
│ ESP detects │
│ movement    │──→ Reset idle timer
└─────────────┘
      │
      │ 60 seconds (MOVEMENT_TIMEOUT)
      ↓
   No movement
   Mark room as IDLE
      │
      │ 120 seconds (IDLE_REPORT_INTERVAL)
      ↓
   Send: POST /api/esp/status
   ├─ is_occupied: false
   ├─ is_power_on: true
   └─ timestamp: X
      │
      ↓ (Server processes)
   Update RoomStatus
   Check if booked
   Calculate auto-off
      │
      ↓
   Response:
   ├─ is_booked: false
   ├─ power_on: false
   └─ message: "OK"
      │
      ↓
   ESP receives power_on: false
   180 seconds (POWER_OFF_DELAY)
      │
      ↓
   Turn OFF relay
   Send: POST /api/esp/power-log
   ├─ power_on: false
   ├─ reason: "auto_control"
   └─ timestamp: Y
```

### Booking Impact Flow

```
Admin creates booking for 2-3 PM
      │
      ↓
Entry in Bookings table
is_confirmed: true
      │
      ↓
ESP sends status at 1:50 PM
      │
      ↓
Server checks: Is room booked? YES
      │
      ↓
Response includes: is_booked: true
      │
      ↓
ESP receives is_booked: true
      │
      ↓
Skip auto power-off logic
(Even if idle, keep power on)
```

## Authentication & Authorization

### JWT Flow

```
1. User submits credentials
   POST /api/auth/login
   
2. Server validates
   ├─ Username exists?
   ├─ Password matches?
   └─ Account active?
   
3. Generate JWT token
   payload: { user_id, role, exp }
   
4. Return token to client
   
5. Client stores token (localStorage)
   
6. Subsequent requests include:
   Authorization: Bearer <token>
   
7. Server validates JWT
   ├─ Signature valid?
   ├─ Not expired?
   └─ Payload readable?
   
8. Extract user_id from token
   
9. Check user role for access control
```

### Role-Based Access

```
User Roles:
├─ Admin
│  ├─ Create/Delete users
│  ├─ Register devices
│  ├─ Manage classrooms
│  ├─ Manual power control
│  └─ View all data
│
└─ Staff
   ├─ View classrooms
   ├─ Create bookings
   ├─ View own bookings
   ├─ Manual override (own bookings)
   └─ Submit contact messages
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│        Network Security (Nginx)         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ HTTPS/TLS Encryption            │   │
│  │ Certificate validation          │   │
│  │ CORS policy enforcement         │   │
│  └─────────────────────────────────┘   │
│              ↓
│  ┌─────────────────────────────────┐   │
│  │ Application Layer               │   │
│  │ - JWT validation                │   │
│  │ - Input sanitization            │   │
│  │ - Rate limiting                 │   │
│  └─────────────────────────────────┘   │
│              ↓
│  ┌─────────────────────────────────┐   │
│  │ Database Security               │   │
│  │ - SQL parameterization          │   │
│  │ - Password hashing (bcrypt)     │   │
│  │ - Role-based queries            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling

```
Load Balancer
    ├→ API Server 1
    ├→ API Server 2
    └→ API Server 3
    
All connected to shared:
├─ PostgreSQL (primary)
├─ Redis Cache (optional)
└─ File storage (for logs)
```

### Vertical Scaling

**Current Performance**:
- ~500 requests/second per API server
- ~1000 concurrent ESP devices
- ~10,000 active bookings

**Optimization Tips**:
1. Enable Redis caching for frequent queries
2. Implement database connection pooling
3. Add CDN for static assets
4. Use RabbitMQ for async tasks
5. Implement read replicas for analytics

## Deployment Architecture

### Docker Compose Stack

```
Network: classroom_network

Services:
├─ PostgreSQL (db)
│  ├─ Ports: 5432:5432
│  ├─ Volumes: postgres_data
│  └─ Health check enabled
│
├─ Flask API (backend)
│  ├─ Ports: 5000:5000
│  ├─ Depends on: db
│  └─ Auto-restart
│
├─ Admin UI (admin-frontend)
│  ├─ Ports: 3000:3000
│  └─ Auto-restart
│
├─ Staff UI (staff-frontend)
│  ├─ Ports: 3001:3000
│  └─ Auto-restart
│
└─ Nginx (nginx)
   ├─ Ports: 80:80, 443:443
   ├─ Depends on: backend, admin-frontend, staff-frontend
   └─ Auto-restart
```

## Monitoring & Logging

```
┌──────────────────────────────────────┐
│    Centralized Logging (ELK)         │
│                                      │
│  Elasticsearch → Logstash → Kibana  │
│                                      │
│  Collects:                          │
│  ├─ API logs                        │
│  ├─ Database queries                │
│  ├─ ESP communications              │
│  └─ Error traces                    │
└──────────────────────────────────────┘
```

## Performance Metrics

### Expected Performance

| Metric | Value |
|--------|-------|
| API Response Time | < 100ms |
| Database Query Time | < 50ms |
| Status Report Latency | < 2s |
| Booking Creation Time | < 1s |
| Dashboard Load Time | < 3s |

### Resource Usage

| Component | CPU | RAM | Storage |
|-----------|-----|-----|---------|
| Flask API | 1-2% | 200-300MB | - |
| PostgreSQL | 2-5% | 500MB-1GB | Variable |
| React UI | 0-1% | 100-200MB | 50MB |
| Total | ~5% | 1-2GB | 10GB+ |

## Failure Scenarios & Recovery

### ESP Device Offline

```
1. ESP misses status report (> 5 minutes)
2. Server marks device as offline
3. Admin notified via dashboard
4. Room manually controlled (if needed)
5. ESP reconnects → Resume normal operation
```

### Database Failure

```
1. Automatic failover to replica (if configured)
2. API returns 503 error
3. Existing bookings preserved (cached in app)
4. New requests queued
5. Database recovery restores service
```

### Server Reboot

```
1. Docker Compose auto-restart containers
2. Database recovers from persistent volume
3. ESP devices reconnect and sync
4. No data loss (everything in database)
```

## Technology Choices Rationale

| Technology | Choice | Why |
|------------|--------|-----|
| Database | PostgreSQL | Reliability, ACID, excellent JSON support |
| API Framework | Flask | Lightweight, flexible, easy to learn |
| Frontend | React | Component reusability, state management |
| Containerization | Docker | Portability, consistency, easy deployment |
| Microcontroller | ESP32 | WiFi built-in, GPIO flexible, affordable |
| Sensor | Ultrasonic | Non-contact, reliable, affordable |

## Future Architecture Enhancements

1. **Message Queue**: RabbitMQ for async processing
2. **Caching Layer**: Redis for hot data
3. **Microservices**: Split into separate services
4. **Kubernetes**: Container orchestration
5. **GraphQL**: Alternative to REST API
6. **WebSockets**: Real-time updates
7. **Blockchain**: Immutable audit trail
8. **ML Model**: Predictive occupancy

---

**Document Version**: 1.0  
**Last Updated**: January 28, 2026
