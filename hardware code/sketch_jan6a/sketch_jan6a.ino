#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <espnow.h>

// Wi-Fi credentials
const char* ssid = "21:02:44";
const char* password = "";

// Web server on port 80
ESP8266WebServer server(80);

// Structure to hold LED matrix commands
typedef struct {
  int command;    // 0: toggle LED, 1: clear matrix, 2: set brightness
  int row;
  int col;
  int brightness;
} LedCommand;

// Slave's MAC address (replace with the actual MAC address of the slave)
uint8_t slaveMAC[] = {0xD8, 0xF1, 0x5B, 0x10, 0x7C, 0x42}; // Update with the slave's MAC address

void setup() {
  Serial.begin(74880);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected to WiFi");

  // Initialize ESP-NOW
  if (esp_now_init() != 0) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  // Add peer (slave)
  esp_now_set_self_role(ESP_NOW_ROLE_CONTROLLER);
  esp_now_add_peer(slaveMAC, ESP_NOW_ROLE_SLAVE, 1, NULL, 0);

  // Initialize web server
  server.on("/", handleRoot);
  server.on("/toggle", HTTP_GET, handleToggle);
  server.on("/clear", HTTP_GET, handleClear);
  server.on("/brightness", HTTP_GET, handleBrightness);
  server.begin();
  Serial.println("Web server started");
  Serial.println("IP Address: " + WiFi.localIP().toString());
}

void loop() {
  server.handleClient();
}

// Handle root page
void handleRoot() {
  String html = "<h1>LED Matrix Control</h1>";
  html += "<p><a href='/clear'>Clear Matrix</a></p>";
  html += "<p><a href='/brightness?level=5'>Set Brightness to 5</a></p>";
  server.send(200, "text/html", html);
}

// Handle LED toggle
void handleToggle() {
  if (server.hasArg("row") && server.hasArg("col")) {
    int row = server.arg("row").toInt();
    int col = server.arg("col").toInt();
    
    LedCommand cmd = {0, row, col, 0};
    esp_now_send(slaveMAC, (uint8_t*)&cmd, sizeof(cmd));

    server.send(200, "text/plain", "LED Toggled");
  }
}

// Handle clear matrix
void handleClear() {
  LedCommand cmd = {1, 0, 0, 0};
  esp_now_send(slaveMAC, (uint8_t*)&cmd, sizeof(cmd));

  server.send(200, "text/plain", "Matrix Cleared");
}

// Handle brightness adjustment
void handleBrightness() {
  if (server.hasArg("level")) {
    int brightness = server.arg("level").toInt();
    
    LedCommand cmd = {2, 0, 0, brightness};
    esp_now_send(slaveMAC, (uint8_t*)&cmd, sizeof(cmd));

    server.send(200, "text/plain", "Brightness Set");
  }
}
