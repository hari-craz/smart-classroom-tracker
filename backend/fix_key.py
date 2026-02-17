
import os
import psycopg2
from urllib.parse import urlparse

# Get DB URL from .env manually or hardcode it
DATABASE_URL = "postgresql://classroom:classroom_secure_password@localhost:5432/classroom_tracker"

try:
    print(f"Connecting to: {DATABASE_URL}")
    result = urlparse(DATABASE_URL)
    username = result.username
    password = result.password
    database = result.path[1:]
    hostname = result.hostname
    port = result.port
    
    conn = psycopg2.connect(
        database = database,
        user = username,
        password = password,
        host = hostname,
        port = port
    )

    cur = conn.cursor()
    
    # Check if device exists
    print("Checking for CLASSROOM_001...")
    cur.execute("SELECT * FROM esp_devices WHERE device_id = 'CLASSROOM_001';")
    device = cur.fetchone()

    if device:
        print(f"Device found: {device}")
        print("Updating API Key to 'key_pdtdxyal4g'...")
        cur.execute("UPDATE esp_devices SET api_key = 'key_pdtdxyal4g' WHERE device_id = 'CLASSROOM_001';")
    else:
        print("Device NOT found. Creating it...")
        cur.execute("""
            INSERT INTO esp_devices (device_id, name, api_key, mac_address, is_active, created_at, updated_at)
            VALUES ('CLASSROOM_001', 'Classroom 101 Node', 'key_pdtdxyal4g', '00:00:00:00:00:00', true, NOW(), NOW());
        """)

    conn.commit()
    print("SUCCESS! Database updated.")
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
