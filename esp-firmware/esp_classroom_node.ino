/*
 * Smart Classroom Utilization Tracker - ESP32/ESP8266 Firmware
 *
 * This firmware handles:
 * - Ultrasonic sensor-based movement detection
 * - Idle time calculation
 * - Periodic status reporting to server
 * - Secure authentication using device ID and API key
 * - Receiving power control commands from server
 * - Relay-based electricity ON/OFF control
 * - Fail-safe logic (never auto-cut power if room is booked)
 *
 * Target Devices: ESP32 / ESP8266
 * Requires: WiFi connection, Ultrasonic sensor (HC-SR04), Relay module
 */

#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <time.h>

// ============================================================================
// CONFIGURATION - MODIFY THESE FOR YOUR SETUP
// ============================================================================

const char *WIFI_SSID = "Nothing 3a Pro";
const char *WIFI_PASSWORD = "hari1234";

const char *SERVER_URL = "http://10.207.228.150:5000"; // Central server IP
const char *DEVICE_ID = "CLASSROOM_001";
const char *API_KEY = "key_yguowyaj6q";

// Timing Configuration (in seconds)
const int MOVEMENT_TIMEOUT = 60;      // 1 minute - consider idle after this
const int IDLE_REPORT_INTERVAL = 120; // 2 minutes - send status to server
const int POWER_OFF_DELAY =
    180; // 3 minutes - auto power off if idle and unbooked
const int SENSOR_CHECK_INTERVAL = 5; // Check sensor every 5 seconds

// Pin Configuration for ESP32
const int ULTRASONIC_TRIGGER_PIN = 13; // GPIO 13
const int ULTRASONIC_ECHO_PIN = 12;    // GPIO 12
const int RELAY_PIN = 14;              // GPIO 14

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

unsigned long lastMovementTime = 0;
unsigned long lastReportTime = 0;
unsigned long lastPowerCheckTime = 0;
unsigned long lastSensorCheckTime = 0;

bool isRoomOccupied = false;
bool isPowerOn = true;
bool isRoomBooked = false;

float lastDistance = 0;
const float MOTION_DETECTION_THRESHOLD = 50; // cm - distance to detect motion

// ============================================================================
// SETUP & INITIALIZATION
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(100);

  Serial.println("\n\nSmart Classroom Node Starting...");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);

  // Initialize pins
  pinMode(ULTRASONIC_TRIGGER_PIN, OUTPUT);
  pinMode(ULTRASONIC_ECHO_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);

  // Default: Power OFF (relay high)
  digitalWrite(RELAY_PIN, HIGH);
  isPowerOn = false;

  // Connect to WiFi
  connectToWiFi();

  // Sync time with NTP
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("Waiting for NTP time sync...");
  time_t now = time(nullptr);
  while (now < 24 * 3600 * 2) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println("\nTime synced!");

  lastMovementTime = millis();
  lastReportTime = millis();
  lastPowerCheckTime = millis();
  lastSensorCheckTime = millis();
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  unsigned long currentTime = millis();

  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    connectToWiFi();
  }

  // Periodic sensor check
  if (currentTime - lastSensorCheckTime >= SENSOR_CHECK_INTERVAL * 1000) {
    lastSensorCheckTime = currentTime;
    detectMovement();
  }

  // Calculate idle status
  unsigned long idleTime = (currentTime - lastMovementTime) / 1000;
  bool currentlyIdle = (idleTime >= MOVEMENT_TIMEOUT);

  if (currentlyIdle != isRoomOccupied) {
    isRoomOccupied = !currentlyIdle;
    Serial.print("Room status changed: ");
    Serial.println(isRoomOccupied ? "OCCUPIED" : "IDLE");
  }

  // Send periodic status report to server
  if (currentTime - lastReportTime >= IDLE_REPORT_INTERVAL * 1000) {
    lastReportTime = currentTime;
    reportStatusToServer();
  }

  // Auto power-off logic
  if (currentTime - lastPowerCheckTime >= POWER_OFF_DELAY * 1000) {
    lastPowerCheckTime = currentTime;
    handleAutoPowerOff();
  }

  delay(100); // Avoid busy-waiting
}

// ============================================================================
// SENSOR FUNCTIONS
// ============================================================================

void detectMovement() {
  float distance = getUltrasonicDistance();

  if (distance > 0 && distance < MOTION_DETECTION_THRESHOLD) {
    // Movement detected
    lastMovementTime = millis();
    Serial.print("Movement detected at distance: ");
    Serial.print(distance);
    Serial.println(" cm");
  }

  lastDistance = distance;
}

float getUltrasonicDistance() {
  // Send 10 microsecond pulse
  digitalWrite(ULTRASONIC_TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(ULTRASONIC_TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRASONIC_TRIGGER_PIN, LOW);

  // Measure echo time
  long duration =
      pulseIn(ULTRASONIC_ECHO_PIN, HIGH, 30000); // timeout after 30ms

  if (duration == 0) {
    return -1; // Sensor error
  }

  // Calculate distance (speed of sound = 343 m/s = 0.0343 cm/µs)
  float distance = (duration * 0.0343) / 2;

  return distance;
}

// ============================================================================
// NETWORK & COMMUNICATION FUNCTIONS
// ============================================================================

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect to WiFi");
  }
}

void reportStatusToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping status report");
    return;
  }

  HTTPClient http;

  String url = String(SERVER_URL) + "/api/esp/status";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-ID", DEVICE_ID);
  http.addHeader("X-API-Key", API_KEY);

  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["device_id"] = DEVICE_ID;
  doc["is_occupied"] = isRoomOccupied;
  doc["is_power_on"] = isPowerOn;
  doc["last_movement"] = (long)((millis() - lastMovementTime) / 1000);
  doc["temperature"] = getTemperature();
  doc["timestamp"] = (long)time(nullptr);

  String jsonData;
  serializeJson(doc, jsonData);

  Serial.print("Sending status: ");
  Serial.println(jsonData);

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Server response: ");
    Serial.println(response);

    // Parse server commands
    parseServerResponse(response);
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

void parseServerResponse(String response) {
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, response);

  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.f_str());
    return;
  }

  // Check for power control command
  if (doc.containsKey("power_on")) {
    bool commandedPowerOn = doc["power_on"];
    setPowerRelay(commandedPowerOn);
  }

  // Check booking status
  if (doc.containsKey("is_booked")) {
    isRoomBooked = doc["is_booked"];
  }
}

void handleAutoPowerOff() {
  if (!isPowerOn) {
    return; // Already off
  }

  unsigned long idleTime = (millis() - lastMovementTime) / 1000;

  // Safety check: Don't auto-off if room is booked
  if (isRoomBooked) {
    Serial.println("Room is booked, auto power-off disabled");
    return;
  }

  // Auto power-off if idle and not booked
  if (idleTime >= POWER_OFF_DELAY) {
    Serial.println("Auto power-off: Room idle and not booked");
    setPowerRelay(false);
  }
}

void setPowerRelay(bool turnOn) {
  if (turnOn == isPowerOn) {
    return; // Already in desired state
  }

  Serial.print("Setting power: ");
  Serial.println(turnOn ? "ON" : "OFF");

  // LOW = ON (relay energized), HIGH = OFF (relay de-energized)
  digitalWrite(RELAY_PIN, turnOn ? LOW : HIGH);
  isPowerOn = turnOn;

  // Log the change
  logPowerChange(turnOn);
}

void logPowerChange(bool turnedOn) {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/esp/power-log";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-ID", DEVICE_ID);
  http.addHeader("X-API-Key", API_KEY);

  StaticJsonDocument<150> doc;
  doc["device_id"] = DEVICE_ID;
  doc["power_on"] = turnedOn;
  doc["timestamp"] = (long)time(nullptr);
  doc["reason"] = "auto_control";

  String jsonData;
  serializeJson(doc, jsonData);

  http.POST(jsonData);
  http.end();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

float getTemperature() {
  // Placeholder - integrate actual temperature sensor if needed
  // For now, return a dummy value
  return 22.5;
}

void printDebugInfo() {
  Serial.println("\n=== DEBUG INFO ===");
  Serial.print("WiFi Status: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);
  Serial.print("Room Occupied: ");
  Serial.println(isRoomOccupied ? "Yes" : "No");
  Serial.print("Power On: ");
  Serial.println(isPowerOn ? "Yes" : "No");
  Serial.print("Room Booked: ");
  Serial.println(isRoomBooked ? "Yes" : "No");
  Serial.print("Last Distance: ");
  Serial.print(lastDistance);
  Serial.println(" cm");
  Serial.println("==================\n");
}

// ============================================================================
// OPTIONAL: Serial Command Handler
// ============================================================================

void handleSerialCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command == "status") {
      printDebugInfo();
    } else if (command == "power_on") {
      setPowerRelay(true);
    } else if (command == "power_off") {
      setPowerRelay(false);
    } else if (command == "report") {
      reportStatusToServer();
    } else if (command == "reset_movement") {
      lastMovementTime = millis();
      Serial.println("Movement timer reset");
    } else {
      Serial.println("Unknown command");
    }
  }
}
