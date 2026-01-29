# Smart Classroom Utilization Tracker - API Documentation

**Base URL**: `http://localhost:5000` or `https://your-server-ip`

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [ESP Device Communication](#esp-device-communication)
3. [Admin APIs](#admin-apis)
4. [Staff APIs](#staff-apis)
5. [Contact APIs](#contact-apis)
6. [Error Handling](#error-handling)

---

## Authentication

### User Registration

Create a new user account.

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password_123"
}
```

**Response** (201 Created):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "staff",
    "is_active": true,
    "created_at": "2026-01-28T12:00:00",
    "updated_at": "2026-01-28T12:00:00"
  }
}
```

---

### User Login

Authenticate user and receive JWT token.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "username": "john_doe",
  "password": "secure_password_123"
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "staff",
    "is_active": true,
    "created_at": "2026-01-28T12:00:00",
    "updated_at": "2026-01-28T12:00:00"
  }
}
```

**Error** (401 Unauthorized):
```json
{
  "error": "Invalid credentials"
}
```

---

## ESP Device Communication

### ESP Device Authentication

All ESP requests must include:
- Header: `X-Device-ID: CLASSROOM_001`
- Header: `X-API-Key: generated_api_key`

---

### Report Room Status

ESP device sends occupancy and power status to server.

**Endpoint**: `POST /api/esp/status`

**Headers**:
```
Content-Type: application/json
X-Device-ID: CLASSROOM_001
X-API-Key: your_api_key
```

**Request Body**:
```json
{
  "device_id": "CLASSROOM_001",
  "is_occupied": true,
  "is_power_on": true,
  "last_movement": 45,
  "temperature": 22.5,
  "timestamp": 1674898800
}
```

**Response** (200 OK):
```json
{
  "message": "Status received",
  "is_booked": false,
  "power_on": true
}
```

**Notes**:
- `last_movement`: Seconds since last detected movement
- `temperature`: Optional, room temperature in Celsius
- `is_booked`: Server indicates if room is currently booked (prevents auto power-off)
- `power_on`: Server command to turn power on/off

---

### Log Power Changes

Log when ESP device changes power state.

**Endpoint**: `POST /api/esp/power-log`

**Headers**:
```
Content-Type: application/json
X-Device-ID: CLASSROOM_001
X-API-Key: your_api_key
```

**Request Body**:
```json
{
  "device_id": "CLASSROOM_001",
  "power_on": true,
  "reason": "auto_control",
  "timestamp": 1674898800
}
```

**Response** (200 OK):
```json
{
  "message": "Power log recorded"
}
```

**Reason Values**:
- `auto_control`: Automatic control based on occupancy
- `manual`: Manual override by admin
- `schedule`: Scheduled operation

---

## Admin APIs

### User Management

#### Get All Users

**Endpoint**: `GET /api/admin/users`

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "is_active": true,
    "created_at": "2026-01-28T12:00:00"
  },
  {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "staff",
    "is_active": true,
    "created_at": "2026-01-28T12:30:00"
  }
]
```

---

#### Create User

**Endpoint**: `POST /api/admin/users`

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "username": "new_user",
  "email": "user@example.com",
  "password": "secure_password",
  "role": "staff"
}
```

**Response** (201 Created):
```json
{
  "id": 3,
  "username": "new_user",
  "email": "user@example.com",
  "role": "staff",
  "is_active": true,
  "created_at": "2026-01-28T13:00:00"
}
```

---

#### Delete User

**Endpoint**: `DELETE /api/admin/users/<user_id>`

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "message": "User deleted"
}
```

---

### Device Management

#### Get All Devices

**Endpoint**: `GET /api/admin/devices`

**Response** (200 OK):
```json
[
  {
    "device_id": "CLASSROOM_001",
    "name": "Main Hall ESP32",
    "mac_address": "00:1A:2B:3C:4D:5E",
    "is_active": true,
    "last_seen": "2026-01-28T13:45:00",
    "firmware_version": "1.0.0",
    "created_at": "2026-01-28T12:00:00"
  }
]
```

---

#### Register Device

**Endpoint**: `POST /api/admin/devices`

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "device_id": "CLASSROOM_002",
  "name": "Chemistry Lab ESP32",
  "api_key": "key_abcd1234efgh5678ijkl9012",
  "mac_address": "00:1A:2B:3C:4D:5F"
}
```

**Response** (201 Created):
```json
{
  "device_id": "CLASSROOM_002",
  "name": "Chemistry Lab ESP32",
  "mac_address": "00:1A:2B:3C:4D:5F",
  "is_active": true,
  "last_seen": null,
  "firmware_version": null,
  "created_at": "2026-01-28T14:00:00"
}
```

---

### Classroom Management

#### Get All Classrooms

**Endpoint**: `GET /api/admin/classrooms`

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Physics Lab",
    "location": "Building A, Floor 2",
    "capacity": 30,
    "esp_device_id": "CLASSROOM_001",
    "is_active": true,
    "status": {
      "classroom_id": 1,
      "is_occupied": true,
      "is_power_on": true,
      "last_movement": 45,
      "temperature": 22.5,
      "last_updated": "2026-01-28T13:45:00"
    },
    "created_at": "2026-01-28T12:00:00"
  }
]
```

---

#### Create Classroom

**Endpoint**: `POST /api/admin/classrooms`

**Request Body**:
```json
{
  "name": "Biology Lab",
  "location": "Building B, Floor 1",
  "capacity": 25,
  "esp_device_id": "CLASSROOM_002"
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "name": "Biology Lab",
  "location": "Building B, Floor 1",
  "capacity": 25,
  "esp_device_id": "CLASSROOM_002",
  "is_active": true,
  "created_at": "2026-01-28T14:00:00"
}
```

---

### Power Control

#### Control Power

Manually control power for a classroom.

**Endpoint**: `POST /api/admin/power/<classroom_id>`

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "power_on": true
}
```

**Response** (200 OK):
```json
{
  "message": "Power control command sent",
  "device_id": "CLASSROOM_001",
  "power_on": true
}
```

---

## Staff APIs

### Get Available Classrooms

**Endpoint**: `GET /api/staff/classrooms`

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Physics Lab",
    "location": "Building A, Floor 2",
    "capacity": 30,
    "esp_device_id": "CLASSROOM_001",
    "is_active": true,
    "status": {
      "is_occupied": false,
      "is_power_on": false,
      "last_movement": 120,
      "temperature": 21.0,
      "last_updated": "2026-01-28T13:45:00"
    }
  }
]
```

---

### Booking Management

#### Get User Bookings

**Endpoint**: `GET /api/staff/bookings`

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "user_id": 2,
    "classroom_id": 1,
    "start_time": "2026-01-28T14:00:00",
    "end_time": "2026-01-28T15:30:00",
    "title": "Physics Lab Session",
    "description": "Advanced optics experiment",
    "is_confirmed": true,
    "created_at": "2026-01-28T12:00:00"
  }
]
```

---

#### Create Booking

**Endpoint**: `POST /api/staff/bookings`

**Request Body**:
```json
{
  "classroom_id": 1,
  "start_time": "2026-01-29T10:00:00",
  "end_time": "2026-01-29T11:30:00",
  "title": "Physics Practical",
  "description": "Newton's laws experiment"
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "user_id": 2,
  "classroom_id": 1,
  "start_time": "2026-01-29T10:00:00",
  "end_time": "2026-01-29T11:30:00",
  "title": "Physics Practical",
  "description": "Newton's laws experiment",
  "is_confirmed": true,
  "created_at": "2026-01-28T14:00:00"
}
```

**Error** (409 Conflict):
```json
{
  "error": "Time slot already booked"
}
```

---

## Contact APIs

### Submit Contact Message

**Endpoint**: `POST /api/contact`

**Request Body**:
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "subject": "Bug in booking system",
  "message": "I encountered an issue when trying to book a classroom for next week",
  "message_type": "bug_report"
}
```

**Response** (201 Created):
```json
{
  "message": "Your message has been sent",
  "contact_id": 1
}
```

**Message Types**:
- `query`: General query
- `bug_report`: Bug report
- `feedback`: Feedback

---

### Get Contact Messages (Admin)

**Endpoint**: `GET /api/admin/contact-messages`

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "sender_name": "John Smith",
    "sender_email": "john@example.com",
    "subject": "Bug in booking system",
    "message": "I encountered an issue...",
    "message_type": "bug_report",
    "is_read": false,
    "created_at": "2026-01-28T14:00:00"
  }
]
```

---

## Error Handling

### Standard Error Responses

**400 Bad Request**:
```json
{
  "error": "Missing required fields"
}
```

**401 Unauthorized**:
```json
{
  "error": "Invalid credentials"
}
```

**403 Forbidden**:
```json
{
  "error": "Unauthorized"
}
```

**404 Not Found**:
```json
{
  "error": "Not found"
}
```

**409 Conflict**:
```json
{
  "error": "Time slot already booked"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

- **ESP Devices**: 1 request per 10 seconds per device
- **Users**: 100 requests per minute
- **Admin**: Unlimited for trusted users

---

## Webhook Events

Future enhancement to send webhooks on:
- Room occupancy changes
- Power state changes
- Booking confirmations
- Device offline alerts

---

## Example Workflows

### ESP Device First-Time Connection

```
1. ESP sends POST /api/esp/status with Device ID and API Key
2. Server validates credentials
3. Server updates RoomStatus record
4. Server checks if room is booked
5. Server returns current power state to ESP
```

### Staff Booking Room

```
1. Staff fetches classrooms: GET /api/staff/classrooms
2. Staff creates booking: POST /api/staff/bookings
3. Server checks for conflicts
4. Server creates booking record
5. On status update, ESP receives is_booked flag
6. ESP prevents auto power-off
```

### Admin Manual Power Control

```
1. Admin fetches classrooms: GET /api/admin/classrooms
2. Admin sends power command: POST /api/admin/power/<id>
3. Server logs power change
4. On next status update, ESP receives power command
5. ESP updates relay state
6. Server receives confirmation via power-log endpoint
```

---

## Authentication Flow

```
Client                          Server
  |                               |
  |--POST /api/auth/login-------->|
  |                               | Validate credentials
  |<----access_token--------------|
  |                               |
  |--GET /api/staff/bookings---->|
  |   Authorization: Bearer token |
  |                               | Validate JWT
  |<----Bookings array------------|
```

---

**API Version**: 1.0
**Last Updated**: January 28, 2026
