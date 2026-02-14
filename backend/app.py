"""
Smart Classroom Utilization Tracker - Backend API Server
Built with Flask and PostgreSQL
"""
# pyre-ignore-all-errors

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from functools import wraps
import os
import logging
from dotenv import load_dotenv

load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*", "allow_headers": ["Content-Type", "Authorization"], "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}})

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 
    'postgresql://classroom:password@db:5432/classroom_tracker'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Error Handlers
@jwt.invalid_token_loader
def invalid_token_callback(error_string):
    logger.error(f"Invalid token: {error_string}")
    return jsonify({'error': 'Invalid token', 'message': error_string}), 401

@jwt.unauthorized_loader
def unauthorized_callback(error_string):
    logger.error(f"Unauthorized: {error_string}")
    return jsonify({'error': 'Unauthorized', 'message': error_string}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    logger.error(f"Token expired: {jwt_payload}")
    return jsonify({'error': 'Token expired', 'message': 'Token has expired'}), 401

# Request logging middleware
@app.before_request
def log_request():
    auth_header = request.headers.get('Authorization', 'None')
    if auth_header != 'None':
        logger.info(f"Request: {request.method} {request.path} - Origin: {request.headers.get('Origin', 'N/A')} - Auth Header: {auth_header[:50]}...")
    else:
        logger.info(f"Request: {request.method} {request.path} - Origin: {request.headers.get('Origin', 'N/A')} - Auth: No")

@app.after_request
def log_response(response):
    logger.info(f"Response: {request.method} {request.path} - Status: {response.status}")
    return response

# ============================================================================
# DATABASE MODELS
# ============================================================================

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='staff')  # 'admin' or 'staff'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    bookings = db.relationship('Booking', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_password=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        return data


class Classroom(db.Model):
    __tablename__ = 'classrooms'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    location = db.Column(db.String(200))
    capacity = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    esp_device_id = db.Column(db.String(50), db.ForeignKey('esp_devices.device_id'))
    esp_device = db.relationship('ESPDevice', backref='classroom', uselist=False)
    room_status = db.relationship('RoomStatus', backref='classroom', lazy=True, uselist=False)
    bookings = db.relationship('Booking', backref='classroom', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'capacity': self.capacity,
            'is_active': self.is_active,
            'esp_device_id': self.esp_device_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class ESPDevice(db.Model):
    __tablename__ = 'esp_devices'
    
    device_id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    api_key = db.Column(db.String(255), nullable=False)
    mac_address = db.Column(db.String(17))
    is_active = db.Column(db.Boolean, default=True)
    last_seen = db.Column(db.DateTime)
    firmware_version = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    status_logs = db.relationship('StatusLog', backref='esp_device', lazy=True)
    power_logs = db.relationship('PowerLog', backref='esp_device', lazy=True)
    
    def to_dict(self):
        now = datetime.utcnow()
        is_connected = False
        if self.last_seen:
            diff = (now - self.last_seen).total_seconds()
            is_connected = diff < 120  # Connected if seen within 2 minutes
        
        return {
            'device_id': self.device_id,
            'name': self.name,
            'mac_address': self.mac_address,
            'is_active': self.is_active,
            'is_connected': is_connected,
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'firmware_version': self.firmware_version,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class RoomStatus(db.Model):
    __tablename__ = 'room_status'
    
    id = db.Column(db.Integer, primary_key=True)
    classroom_id = db.Column(db.Integer, db.ForeignKey('classrooms.id'), unique=True)
    is_occupied = db.Column(db.Boolean, default=False)
    is_power_on = db.Column(db.Boolean, default=False)
    last_movement = db.Column(db.Integer, default=0)  # seconds since last movement
    temperature = db.Column(db.Float)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'classroom_id': self.classroom_id,
            'is_occupied': self.is_occupied,
            'is_power_on': self.is_power_on,
            'last_movement': self.last_movement,
            'temperature': self.temperature,
            'last_updated': self.last_updated.isoformat()
        }


class Booking(db.Model):
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    classroom_id = db.Column(db.Integer, db.ForeignKey('classrooms.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    is_confirmed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'classroom_id': self.classroom_id,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat(),
            'title': self.title,
            'description': self.description,
            'is_confirmed': self.is_confirmed,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class StatusLog(db.Model):
    __tablename__ = 'status_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(50), db.ForeignKey('esp_devices.device_id'), nullable=False)
    is_occupied = db.Column(db.Boolean)
    is_power_on = db.Column(db.Boolean)
    last_movement = db.Column(db.Integer)
    temperature = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'device_id': self.device_id,
            'is_occupied': self.is_occupied,
            'is_power_on': self.is_power_on,
            'last_movement': self.last_movement,
            'temperature': self.temperature,
            'timestamp': self.timestamp.isoformat()
        }


class PowerLog(db.Model):
    __tablename__ = 'power_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(50), db.ForeignKey('esp_devices.device_id'), nullable=False)
    power_on = db.Column(db.Boolean, nullable=False)
    reason = db.Column(db.String(50))  # 'manual', 'auto_control', 'schedule'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'device_id': self.device_id,
            'power_on': self.power_on,
            'reason': self.reason,
            'timestamp': self.timestamp.isoformat()
        }


class ContactMessage(db.Model):
    __tablename__ = 'contact_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_name = db.Column(db.String(120), nullable=False)
    sender_email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20))  # 'query', 'bug_report', 'feedback'
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'sender_name': self.sender_name,
            'sender_email': self.sender_email,
            'subject': self.subject,
            'message': self.message,
            'message_type': self.message_type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }


# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    user = User(
        username=data['username'],
        email=data['email'],
        role='staff'  # Default role
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict()
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing credentials'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']) or not user.is_active:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200


# ============================================================================
# ESP DEVICE ROUTES
# ============================================================================

def verify_esp_device():
    """Middleware to verify ESP device authentication"""
    def decorator(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            device_id = request.headers.get('X-Device-ID')
            api_key = request.headers.get('X-API-Key')
            
            if not device_id or not api_key:
                return jsonify({'error': 'Missing device credentials'}), 401
            
            device = ESPDevice.query.filter_by(device_id=device_id).first()
            
            if not device or device.api_key != api_key or not device.is_active:
                return jsonify({'error': 'Invalid device credentials'}), 401
            
            return fn(*args, **kwargs)
        return wrapped
    return decorator


@app.route('/api/esp/status', methods=['POST'])
@verify_esp_device()
def esp_status_report():
    """Receive status report from ESP device"""
    data = request.get_json()
    device_id = request.headers.get('X-Device-ID')
    
    try:
        device = ESPDevice.query.filter_by(device_id=device_id).first()
        device.last_seen = datetime.utcnow()
        
        # Log the status
        status_log = StatusLog(
            device_id=device_id,
            is_occupied=data.get('is_occupied'),
            is_power_on=data.get('is_power_on'),
            last_movement=data.get('last_movement'),
            temperature=data.get('temperature')
        )
        
        # Update room status
        classroom = device.classroom
        commands = {}
        if classroom:
            room_status = classroom.room_status
            if not room_status:
                room_status = RoomStatus(classroom_id=classroom.id)
                db.session.add(room_status)
            
            room_status.is_occupied = data.get('is_occupied', False)
            room_status.is_power_on = data.get('is_power_on', False)
            room_status.last_movement = data.get('last_movement', 0)
            room_status.temperature = data.get('temperature')
            room_status.last_updated = datetime.utcnow()
            
            # Check if room should be auto-powered off
            commands = check_auto_power_off(classroom)
        
        db.session.add(status_log)
        db.session.commit()
        
        # Determine if room is booked
        is_booked = check_if_room_booked(classroom.id if classroom else None)
        
        return jsonify({
            'message': 'Status received',
            'is_booked': is_booked,
            'power_on': commands.get('power_on', data.get('is_power_on'))
        }), 200
    
    except Exception as e:
        logger.error(f"Error processing ESP status: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to process status'}), 500


@app.route('/api/esp/heartbeat', methods=['POST'])
@verify_esp_device()
def esp_heartbeat():
    """Lightweight heartbeat from ESP device to report connectivity"""
    device_id = request.headers.get('X-Device-ID')
    
    try:
        device = ESPDevice.query.filter_by(device_id=device_id).first()
        device.last_seen = datetime.utcnow()
        
        # Optionally update firmware version if provided
        data = request.get_json(silent=True)
        if data and data.get('firmware_version'):
            device.firmware_version = data['firmware_version']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Heartbeat received',
            'server_time': datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        logger.error(f"Error processing heartbeat: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to process heartbeat'}), 500


@app.route('/api/esp/power-log', methods=['POST'])
@verify_esp_device()
def esp_power_log():
    """Log power changes from ESP device"""
    data = request.get_json()
    device_id = request.headers.get('X-Device-ID')
    
    try:
        power_log = PowerLog(
            device_id=device_id,
            power_on=data.get('power_on'),
            reason=data.get('reason', 'unknown')
        )
        
        db.session.add(power_log)
        db.session.commit()
        
        return jsonify({'message': 'Power log recorded'}), 200
    
    except Exception as e:
        logger.error(f"Error logging power change: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to log power change'}), 500


# ============================================================================
# ADMIN ROUTES - USER MANAGEMENT
# ============================================================================

@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200


@app.route('/api/admin/users', methods=['POST'])
@jwt_required()
def create_user():
    """Create a new user (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    new_user = User(
        username=data['username'],
        email=data['email'],
        role=data.get('role', 'staff')
    )
    new_user.set_password(data['password'])
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify(new_user.to_dict()), 201


@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete a user (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    user_to_delete = User.query.get(user_id)
    if not user_to_delete:
        return jsonify({'error': 'User not found'}), 404
    
    db.session.delete(user_to_delete)
    db.session.commit()
    
    return jsonify({'message': 'User deleted'}), 200


# ============================================================================
# ADMIN ROUTES - DEVICE MANAGEMENT
# ============================================================================

@app.route('/api/admin/devices', methods=['GET'])
@jwt_required()
def get_devices():
    """Get all ESP devices"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    devices = ESPDevice.query.all()
    return jsonify([d.to_dict() for d in devices]), 200


@app.route('/api/admin/devices/status', methods=['GET'])
@jwt_required()
def get_devices_status():
    """Get all ESP devices with enriched connectivity and classroom info"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    devices = ESPDevice.query.all()
    result = []
    for d in devices:
        data = d.to_dict()
        # Add linked classroom info (backref returns a list)
        linked_classroom = d.classroom[0] if d.classroom else None
        if linked_classroom:
            data['classroom_name'] = linked_classroom.name
            data['classroom_id'] = linked_classroom.id
        else:
            data['classroom_name'] = None
            data['classroom_id'] = None
        result.append(data)
    
    return jsonify(result), 200


@app.route('/api/admin/devices', methods=['POST'])
@jwt_required()
def create_device():
    """Register a new ESP device"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    device = ESPDevice(
        device_id=data['device_id'],
        name=data['name'],
        api_key=data['api_key'],
        mac_address=data.get('mac_address')
    )
    
    db.session.add(device)
    db.session.commit()
    
    return jsonify(device.to_dict()), 201


# ============================================================================
# ADMIN ROUTES - CLASSROOM MANAGEMENT
# ============================================================================

@app.route('/api/admin/classrooms', methods=['GET'])
@jwt_required()
def get_classrooms():
    """Get all classrooms"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    classrooms = Classroom.query.all()
    result = []
    for c in classrooms:
        data = c.to_dict()
        if c.room_status:
            data['status'] = c.room_status.to_dict()
        result.append(data)
    
    return jsonify(result), 200


@app.route('/api/admin/classrooms', methods=['POST'])
@jwt_required()
def create_classroom():
    """Create a new classroom"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    classroom = Classroom(
        name=data['name'],
        location=data.get('location'),
        capacity=data.get('capacity'),
        esp_device_id=data.get('esp_device_id')
    )
    
    db.session.add(classroom)
    db.session.commit()
    
    return jsonify(classroom.to_dict()), 201


# ============================================================================
# ADMIN ROUTES - POWER CONTROL
# ============================================================================

@app.route('/api/admin/power/<int:classroom_id>', methods=['POST'])
@jwt_required()
def control_power(classroom_id):
    """Manually control power for a classroom"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    classroom = Classroom.query.get(classroom_id)
    
    if not classroom or not classroom.esp_device:
        return jsonify({'error': 'Classroom or device not found'}), 404
    
    # Log the manual control
    power_log = PowerLog(
        device_id=classroom.esp_device_id,
        power_on=data['power_on'],
        reason='manual'
    )
    
    db.session.add(power_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Power control command sent',
        'device_id': classroom.esp_device_id,
        'power_on': data['power_on']
    }), 200


# ============================================================================
# STAFF ROUTES - BOOKINGS
# ============================================================================

@app.route('/api/staff/bookings', methods=['GET'])
@jwt_required()
def get_user_bookings():
    """Get bookings for current user"""
    current_user_id = int(get_jwt_identity())
    
    bookings = Booking.query.filter_by(user_id=current_user_id).all()
    return jsonify([b.to_dict() for b in bookings]), 200


@app.route('/api/staff/bookings', methods=['POST'])
@jwt_required()
def create_booking():
    """Create a new booking"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Validate dates
    start_time = datetime.fromisoformat(data['start_time'])
    end_time = datetime.fromisoformat(data['end_time'])
    
    if start_time >= end_time:
        return jsonify({'error': 'Invalid time range'}), 400
    
    # Check for conflicts
    conflict = Booking.query.filter(
        Booking.classroom_id == data['classroom_id'],
        Booking.start_time < end_time,
        Booking.end_time > start_time,
        Booking.is_confirmed == True
    ).first()
    
    if conflict:
        return jsonify({'error': 'Time slot already booked'}), 409
    
    booking = Booking(
        user_id=current_user_id,
        classroom_id=data['classroom_id'],
        start_time=start_time,
        end_time=end_time,
        title=data.get('title'),
        description=data.get('description'),
        is_confirmed=True
    )
    
    db.session.add(booking)
    db.session.commit()
    
    return jsonify(booking.to_dict()), 201


@app.route('/api/staff/classrooms', methods=['GET'])
@jwt_required()
def get_available_classrooms():
    """Get all classrooms with their status"""
    classrooms = Classroom.query.filter_by(is_active=True).all()
    result = []
    
    for c in classrooms:
        data = c.to_dict()
        if c.room_status:
            data['status'] = c.room_status.to_dict()
        result.append(data)
    
    return jsonify(result), 200


# ============================================================================
# CONTACT ROUTES
# ============================================================================

@app.route('/api/contact', methods=['POST'])
def submit_contact():
    """Submit a contact message"""
    data = request.get_json()
    
    message = ContactMessage(
        sender_name=data['name'],
        sender_email=data['email'],
        subject=data['subject'],
        message=data['message'],
        message_type=data.get('message_type', 'query')
    )
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify({
        'message': 'Your message has been sent',
        'contact_id': message.id
    }), 201


@app.route('/api/admin/contact-messages', methods=['GET'])
@jwt_required()
def get_contact_messages():
    """Get all contact messages (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    messages = ContactMessage.query.all()
    return jsonify([m.to_dict() for m in messages]), 200


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def check_auto_power_off(classroom):
    """Check if room should be auto-powered off"""
    commands = {}
    
    if not classroom or not classroom.room_status:
        return commands
    
    # Check if room is booked
    is_booked = check_if_room_booked(classroom.id)
    
    # If idle and not booked, return power off command
    if not classroom.room_status.is_occupied and not is_booked:
        commands['power_on'] = False
    
    return commands


def check_if_room_booked(classroom_id):
    """Check if room is currently booked"""
    if not classroom_id:
        return False
    
    now = datetime.utcnow()
    booking = Booking.query.filter(
        Booking.classroom_id == classroom_id,
        Booking.start_time <= now,
        Booking.end_time >= now,
        Booking.is_confirmed == True
    ).first()
    
    return booking is not None


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    logger.error(f"Internal error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500


# ============================================================================
# INITIALIZATION
# ============================================================================

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        logger.info("Database tables created")
    
    app.run(host='0.0.0.0', port=5000, debug=False)
