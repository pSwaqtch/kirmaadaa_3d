// web_interface.cpp
#include "include/web_interface.h"

ESP8266WebServer server(80);
WebSocketsServer webSocket(81);

void setupWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();
    delay(100);

    bool connected = false;

    // Try each network in order
    for (int i = 0; i < NETWORK_COUNT; i++) {
        Serial.printf("\nAttempting to connect to %s\n", WIFI_NETWORKS[i].ssid);

        WiFi.begin(WIFI_NETWORKS[i].ssid, WIFI_NETWORKS[i].password);

        // Try to connect for 10 seconds
        int attempts = 20; // 20 * 500ms = 10 seconds
        while (attempts > 0 && WiFi.status() != WL_CONNECTED) {
            delay(500);
            Serial.print(".");
            attempts--;
        }

        if (WiFi.status() == WL_CONNECTED) {
            connected = true;
            Serial.printf("\nConnected to %s\n", WIFI_NETWORKS[i].ssid);
            Serial.printf("IP address: %s\n", WiFi.localIP().toString().c_str());
            break;
        } else {
            Serial.printf("\nFailed to connect to %s\n", WIFI_NETWORKS[i].ssid);
        }
    }

    if (!connected) {
        Serial.println("\nFailed to connect to any network!");
        // You might want to restart the ESP or implement a retry mechanism here
        ESP.restart();
    }
}

void setupWebServer() {
    server.on("/", []() { server.send(200, "text/html", WEBPAGE); });
    server.on("/rpm", []() { server.send(200, "text/plain", String(rpm)); });
    server.begin();
    webSocket.begin();
    webSocket.onEvent(handleWebSocket);
}

void handleWebSocket(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    if (type == WStype_TEXT) {
        targetSpeed = atoi((char*)payload);
        Serial.printf("Target speed set to %d µs\n", targetSpeed);
    }
}
