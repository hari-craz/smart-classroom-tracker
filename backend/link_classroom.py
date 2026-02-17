
import os
import psycopg2
from urllib.parse import urlparse

# Get DB URL
DATABASE_URL = "postgresql://classroom:classroom_secure_password@localhost:5432/classroom_tracker"

try:
    print(f"Connecting to: {DATABASE_URL}")
    result = urlparse(DATABASE_URL)
    conn = psycopg2.connect(
        database = result.path[1:],
        user = result.username,
        password = result.password,
        host = result.hostname,
        port = result.port
    )
    cur = conn.cursor()
    
    # 1. Ensure Classroom Exists
    print("Checking for Classroom 101...")
    cur.execute("SELECT id FROM classrooms WHERE name = 'Classroom 101';")
    room = cur.fetchone()

    if not room:
        print("Classroom 101 NOT found. Creating it...")
        cur.execute("""
            INSERT INTO classrooms (name, location, capacity, is_active, esp_device_id, created_at, updated_at)
            VALUES ('Classroom 101', 'Building A, Room 101', 30, true, 'CLASSROOM_001', NOW(), NOW())
            RETURNING id;
        """)
        room_id = cur.fetchone()[0]
        print(f"Created Classroom ID: {room_id}")
    else:
        room_id = room[0]
        print(f"Found Classroom ID: {room_id}")
        
        # Link it to the device
        print(f"Linking CLASSROOM_001 to Classroom {room_id}...")
        cur.execute("UPDATE classrooms SET esp_device_id = 'CLASSROOM_001' WHERE id = %s;", (room_id,))

    conn.commit()
    print("SUCCESS! Database linked.")
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
