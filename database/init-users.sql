-- Initial users for Smart Classroom Tracker
-- Default admin password: admin123
-- Default staff password: pass123

INSERT INTO users (username, email, password_hash, role, is_active) VALUES
('admin', 'admin@classroom.local', 'scrypt:32768:8:1$WfXJl8Vy7IkJHxvN$5e3b6f4c8a9d2e1f0b3c4a5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4', 'admin', true),
('staff', 'staff@classroom.local', 'scrypt:32768:8:1$AbCdEfGh1234567$1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4', 'staff', true);

-- Note: These are placeholder hashes. The application will create proper hashes on first run.
-- You can register new users through the admin panel or API.
