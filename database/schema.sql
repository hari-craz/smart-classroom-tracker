-- Smart Classroom Utilization Tracker - Database Schema
-- PostgreSQL

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ESP Devices Table
CREATE TABLE esp_devices (
    device_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    mac_address VARCHAR(17),
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP,
    firmware_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classrooms Table
CREATE TABLE classrooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    location VARCHAR(200),
    capacity INTEGER,
    esp_device_id VARCHAR(50) REFERENCES esp_devices(device_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room Status Table
CREATE TABLE room_status (
    id SERIAL PRIMARY KEY,
    classroom_id INTEGER UNIQUE NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    is_occupied BOOLEAN DEFAULT false,
    is_power_on BOOLEAN DEFAULT false,
    last_movement INTEGER DEFAULT 0,
    temperature FLOAT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    title VARCHAR(200),
    description TEXT,
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Status Logs Table (for analytics)
CREATE TABLE status_logs (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL REFERENCES esp_devices(device_id) ON DELETE CASCADE,
    is_occupied BOOLEAN,
    is_power_on BOOLEAN,
    last_movement INTEGER,
    temperature FLOAT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Power Logs Table (for audit trail)
CREATE TABLE power_logs (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL REFERENCES esp_devices(device_id) ON DELETE CASCADE,
    power_on BOOLEAN NOT NULL,
    reason VARCHAR(50) CHECK (reason IN ('manual', 'auto_control', 'schedule', 'unknown')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact Messages Table
CREATE TABLE contact_messages (
    id SERIAL PRIMARY KEY,
    sender_name VARCHAR(120) NOT NULL,
    sender_email VARCHAR(120) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) CHECK (message_type IN ('query', 'bug_report', 'feedback')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_classroom_id ON bookings(classroom_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_end_time ON bookings(end_time);
CREATE INDEX idx_status_logs_device_id ON status_logs(device_id);
CREATE INDEX idx_status_logs_timestamp ON status_logs(timestamp);
CREATE INDEX idx_power_logs_device_id ON power_logs(device_id);
CREATE INDEX idx_power_logs_timestamp ON power_logs(timestamp);
CREATE INDEX idx_esp_devices_last_seen ON esp_devices(last_seen);
