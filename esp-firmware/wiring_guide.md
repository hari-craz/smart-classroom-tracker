# Smart Classroom Node - Wiring Guide

This guide details the wiring connections for the ESP Classroom Node firmware (`esp_classroom_node.ino`). The firmware is designed to work with **ESP32** or **ESP8266 (NodeMCU)** boards, an **HC-SR04** ultrasonic sensor, and a **Relay Module**.

## Component List

1.  **Microcontroller**: ESP32 DevKit V1 or NodeMCU (ESP8266)
2.  **Sensor**: HC-SR04 Ultrasonic Distance Sensor
3.  **Actuator**: 5V Relay Module (Active LOW)
4.  **Power**: USB Cable or 5V External Power Supply
5.  **Misc**: Jumper wires, Breadboard

## Pin Configuration

The firmware uses the following pin definitions.

> **Note for ESP32 Users**: The code uses NodeMCU style pin names (e.g., `D7`, `D8`). If you are compiling for a standard ESP32 board, you may need to replace these with the direct GPIO numbers listed below or ensure your board definition supports the `Dx` mapping.

| Component | Pin Name in Code | NodeMCU (ESP8266) | ESP32 GPIO (Recommended) | Description |
| :--- | :--- | :--- | :--- | :--- |
| **HC-SR04 Trig** | `ULTRASONIC_TRIGGER_PIN` | **D7** | GPIO 13 | Sends the ultrasonic pulse |
| **HC-SR04 Echo** | `ULTRASONIC_ECHO_PIN` | **D8** | GPIO 12 | Receives the reflected pulse |
| **Relay IN** | `RELAY_PIN` | **D5** | GPIO 14 | Controls the relay (Low = ON) |

## Wiring Diagram

### 1. Power Connections
*   **VCC/5V**: Connect the ESP `VIN` pin to the `VCC` of both the Relay and HC-SR04.
    *   *Warning*: The HC-SR04 usually requires 5V. If your ESP board does not have a 5V output pin (VIN often passes USB voltage), you may need an external 5V source.
*   **GND**: Connect all **GND** pins together (ESP, Sensor, Relay).

### 2. Ultrasonic Sensor (HC-SR04)
*   **VCC** -> ESP `VIN` (5V)
*   **GND** -> ESP `GND`
*   **Trig** -> ESP **D7** (ESP8266) / **GPIO 13** (ESP32)
*   **Echo** -> ESP **D8** (ESP8266) / **GPIO 12** (ESP32)
    *   *Safety Note*: The Echo pin outputs 5V logic. The ESP is a 3.3V device. While it often works directly, it is **highly recommended** to use a voltage divider (2kΩ + 1kΩ resistors) to drop the 5V signal to ~3.3V to protect the ESP pin.

### 3. Relay Module
*   **VCC** -> ESP `VIN` (5V)
*   **GND** -> ESP `GND`
*   **IN** -> ESP **D5** (ESP8266) / **GPIO 14** (ESP32)
    *   *Side Note*: The code uses "Active LOW" logic (`digitalWrite(RELAY_PIN, LOW)` turns power ON). Most standard relay modules work this way.

## Schematic Representation

```
       [ ESP8266 / ESP32 ]
           |
       (Power)
           +---[VIN/5V]----------------+-------------------+
           |                           |                   |
           +---[GND]-------------------+-------------------+
           |                           |                   |
       (GPIO)                          |                   |
           |                           | (VCC)             | (VCC)
      [D7 / 13] --------------------[Trig]              [VCC]
           |                           |                   |
      [D8 / 12] --------------------[Echo]              [IN]
           |                       (HC-SR04)            (Relay)
      [D5 / 14] ---------------------------------------/
```

## Setup Instructions

1.  **Connect Hardware**: Wire the components according to the diagram above.
2.  **Update Firmware Config**:
    Open `esp_classroom_node.ino` and update the following lines:
    ```cpp
    const char* WIFI_SSID = "YOUR_WIFI_NAME";
    const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
    const char* SERVER_URL = "http://YOUR_PC_IP_ADDRESS:5000"; // e.g., 192.168.1.5:5000
    ```
3.  **Flash Firmware**: Connect the ESP to your computer and upload the code using the Arduino IDE.
4.  **Verify**: Open the Serial Monitor (115200 baud) to see the connection status and distance readings.
