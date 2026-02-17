
import sqlite3
import os

DB_PATH = 'backend/classroom_tracker.db'

print(f"Connecting to database at: {os.path.abspath(DB_PATH)}")

if not os.path.exists(DB_PATH):
    print("ERROR: Database file not found!")
    exit(1)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Tables found: {tables}")

    print("\n--- DEVICES ---")
    cursor.execute("PRAGMA table_info(devices)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Columns in 'devices': {columns}")

    cursor.execute("SELECT * FROM devices")
    rows = cursor.fetchall()
    
    device_found = False
    for row in rows:
        print(f"Device: {row}")
        if row[0] == 'CLASSROOM_001':
            device_found = True
            print(f"Found CLASSROOM_001! Updating key to 'key_pdtdxyal4g'...")
            cursor.execute("UPDATE devices SET api_key = ? WHERE device_id = ?", ('key_pdtdxyal4g', 'CLASSROOM_001'))
            conn.commit()
            print("Updated successfully.")

    if not device_found:
        print("\nCLASSROOM_001 not found. Inserting it now...")
        cursor.execute("INSERT INTO devices (device_id, api_key, classroom_name, is_connected, last_seen) VALUES (?, ?, ?, ?, ?)", 
                       ('CLASSROOM_001', 'key_pdtdxyal4g', 'Classroom 101', 0, None))
        conn.commit()
        print("Inserted successfully.")

except Exception as e:
    print(f"Error: {e}")

conn.close()
