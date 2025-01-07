// main.ino
#include <ESP8266WiFi.h>
#include "include/config.h"
#include "include/motor_control.h"
#include "include/web_interface.h"

unsigned long lastMillis = 0;

void setup() {
    Serial.begin(74880);
    Serial.println("\n\nESP8266 RPM Measurer");

    setupMotor();
    calibrateESC();
    setupWiFi();
    setupWebServer();
}

void loop() {
    server.handleClient();
    webSocket.loop();

    // Handle speed transitions
    if (currentSpeed != targetSpeed) {
        smoothSpeedTransition();
        delay(STEP_DELAY);
    }

    // Calculate RPM every second
    if (millis() - lastMillis >= 1000) {
        noInterrupts();
        rpm = (count * 60) / RPM_DIVISOR;
        count = 0;
        interrupts();
        lastMillis = millis();
        Serial.printf("Current RPM: %d\n", rpm);
    }
}
