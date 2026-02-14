#!/usr/bin/env python3
# pyre-ignore-all-errors
"""
ESP32 Simulator — Mimics a real ESP device for testing.

Usage:
  python simulator.py --url http://localhost:8089 --device-id CLASSROOM_001 --api-key <key>

This script sends periodic status reports and heartbeats to the backend,
exactly like a real ESP32 running the classroom firmware.
"""

import argparse
import time
import random
import requests
import sys

def send_status(url, device_id, api_key, occupied, power_on, idle_sec):
    """Send a status report identical to the real firmware."""
    headers = {
        "Content-Type": "application/json",
        "X-Device-ID": device_id,
        "X-API-Key": api_key,
    }
    payload = {
        "device_id": device_id,
        "is_occupied": occupied,
        "is_power_on": power_on,
        "last_movement": idle_sec,
        "temperature": round(random.uniform(20.0, 28.0), 1),
    }
    try:
        r = requests.post(f"{url}/api/esp/status", json=payload, headers=headers, timeout=5)
        return r.status_code, r.json()
    except requests.exceptions.ConnectionError:
        return None, "Connection refused — is the backend running?"
    except Exception as e:
        return None, str(e)


def send_heartbeat(url, device_id, api_key):
    """Send a lightweight heartbeat."""
    headers = {
        "Content-Type": "application/json",
        "X-Device-ID": device_id,
        "X-API-Key": api_key,
    }
    try:
        r = requests.post(f"{url}/api/esp/heartbeat", json={}, headers=headers, timeout=5)
        return r.status_code, r.json()
    except requests.exceptions.ConnectionError:
        return None, "Connection refused"
    except Exception as e:
        return None, str(e)


def main():
    parser = argparse.ArgumentParser(description="ESP32 Device Simulator")
    parser.add_argument("--url", default="http://localhost:8089", help="Backend API URL")
    parser.add_argument("--device-id", default="CLASSROOM_001", help="Device ID registered in admin panel")
    parser.add_argument("--api-key", required=True, help="API key from device registration")
    parser.add_argument("--interval", type=int, default=30, help="Status report interval in seconds (default: 30)")
    parser.add_argument("--occupied", action="store_true", help="Simulate room as occupied")
    args = parser.parse_args()

    print(f"""
╔══════════════════════════════════════════════╗
║       ESP32 Simulator — Smart Classroom      ║
╚══════════════════════════════════════════════╝
  Server   : {args.url}
  Device   : {args.device_id}
  Interval : {args.interval}s
  Occupied : {args.occupied}
""")

    cycle = 0
    idle_sec = 0 if args.occupied else 999

    try:
        while True:
            cycle += 1
            now = time.strftime("%H:%M:%S")

            # Send status report
            code, resp = send_status(
                args.url, args.device_id, args.api_key,
                args.occupied, True, idle_sec
            )

            if code == 200:
                power_cmd = resp.get("power_on", "—")
                booked = resp.get("is_booked", "—")
                print(f"[{now}] ✓ Status sent (cycle {cycle}) | power_on={power_cmd} | is_booked={booked}")
            elif code == 401:
                print(f"[{now}] ✗ AUTH FAILED — check device-id and api-key")
                sys.exit(1)
            else:
                print(f"[{now}] ✗ Status failed: {code} — {resp}")

            # Send heartbeat every other cycle
            if cycle % 2 == 0:
                hb_code, _ = send_heartbeat(args.url, args.device_id, args.api_key)
                tag = "✓" if hb_code == 200 else "✗"
                print(f"[{now}] {tag} Heartbeat (HTTP {hb_code})")

            time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\n\nSimulator stopped. Device will show as Offline in ~2 minutes.")


if __name__ == "__main__":
    main()
