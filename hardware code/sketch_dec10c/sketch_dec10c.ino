#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <LedControl.h>
#include <espnow.h>

// Debug macro to enable/disable debug print
#define DEBUG 1
#define DEBUG_SERIAL(x) do { if(DEBUG) { Serial.println(x); } } while(0)

// Define Wi-Fi credentials
const char* ssid = "21:02:44";
const char* password = "";

// Replace with the MAC Address of the other ESP8266
uint8_t peerMAC[] = {0xD8, 0xF1, 0x5B, 0x10, 0x7C, 0x42};

// Define a structure to hold the message
typedef struct message_t {
  bool ledMatrix[8][8];  // 8x8 LED matrix states
  int counter;           // keep the counter for debugging
} message_t;

message_t outgoingMessage;
message_t incomingMessage;

// 2D array to keep track of LED states
bool ledStates[8][8] = {false};



// Pin definitions
#define DIN_PIN 14   // Data IN
#define CS_PIN 12    // Chip Select
#define CLK_PIN 13   // Clock

// Initialize the LedControl object
LedControl lc = LedControl(DIN_PIN, CLK_PIN, CS_PIN, 1); // 1 device connected

// Initialize the web server on port 80
ESP8266WebServer server(80);

// Callback when data is sent
void OnDataSent(uint8_t *mac_addr, uint8_t sendStatus) {
  Serial.print("Data Send Status: ");
  if (sendStatus == 0) {
    Serial.println("Success");
  } else {
    Serial.println("Fail");
  }
}

void OnDataRecv(uint8_t *mac, uint8_t *incomingData, uint8_t len) {
  memcpy(&incomingMessage, incomingData, sizeof(incomingMessage));
  
  // Update the LED matrix with received states
  for (int row = 0; row < 8; row++) {
    for (int col = 0; col < 8; col++) {
      ledStates[row][col] = incomingMessage.ledMatrix[row][col];
      lc.setLed(0, row, col, ledStates[row][col]);
    }
  }
  
  Serial.println("Received LED matrix states:");
  printLedMatrix();
}

// Function to perform a startup blink sequence
void blinkMatrix() {
  DEBUG_SERIAL("Starting matrix blink sequence");
  
  // Sequence 1: All on
  DEBUG_SERIAL("Turning all LEDs on");
  for (int row = 0; row < 8; row++) {
    lc.setRow(0, row, 0xFF);
  }
  delay(500);
  
  // Sequence 2: All off
  DEBUG_SERIAL("Turning all LEDs off");
  lc.clearDisplay(0);
  delay(500);
  
  // Sequence 3: Checkerboard pattern
  DEBUG_SERIAL("Creating checkerboard pattern");
  for (int row = 0; row < 8; row++) {
    byte pattern = (row % 2 == 0) ? 0xAA : 0x55;
    lc.setRow(0, row, pattern);
  }
  delay(500);
  
  // Final clear
  DEBUG_SERIAL("Clearing matrix");
  lc.clearDisplay(0);
}


// Current brightness level (0-15)
int currentBrightness = 7;


void setup() {
  // Initialize serial communication with specified baud rate
  Serial.begin(74880);
  
  // Debug: Print startup message
  DEBUG_SERIAL("\n\nESP8266 LED Matrix Web Control");
  DEBUG_SERIAL("------------------------------");
  
  // Debug: Print pin configuration
  DEBUG_SERIAL("Pin Configuration:");
  DEBUG_SERIAL("DIN: " + String(DIN_PIN));
  DEBUG_SERIAL("CS: " + String(CS_PIN));
  DEBUG_SERIAL("CLK: " + String(CLK_PIN));
  
  // Connect to Wi-Fi with extensive debugging
  DEBUG_SERIAL("Attempting Wi-Fi Connection...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    attempts++;
    
    // Debug: Show connection attempts
    if (attempts % 10 == 0) {
      DEBUG_SERIAL("\nConnection attempt " + String(attempts) + 
                   " - Status: " + String(WiFi.status()));
    }
    
    // Prevent infinite loop
    if (attempts > 30) {
      DEBUG_SERIAL("\nFailed to connect to WiFi. Restarting.");
      ESP.restart();
    }
  }
  
  // Debug: WiFi connection successful
  DEBUG_SERIAL("\nWiFi Connected Successfully!");
  DEBUG_SERIAL("IP Address: " + WiFi.localIP().toString());
  
  // Initialize LED Matrix
  DEBUG_SERIAL("Initializing LED Matrix");
  lc.shutdown(0, false);  // Wake up the MAX7219
  lc.clearDisplay(0);     // Clear the display
  
  // Perform startup blink sequence
  blinkMatrix();
  
  // Start the web server with debug endpoints
  DEBUG_SERIAL("Setting up Web Server Endpoints");
  server.on("/", HTTP_GET, handleRoot);
  server.on("/toggle", HTTP_GET, handleToggle);
  server.on("/clear", HTTP_GET, handleClear);
  server.on("/debug", HTTP_GET, handleDebug);
  server.on("/brightness", HTTP_GET, handleBrightness);
  server.on("/pattern", []() {
    String pattern = server.arg("type");
    applyPattern(pattern);
    server.send(200, "text/plain", "Pattern applied: " + pattern);
  });

  server.on("/data", HTTP_GET, sendDataESP);
  
  server.begin();
  DEBUG_SERIAL("Web Server Started Successfully");

  WiFi.mode(WIFI_STA);
  
  // Print the MAC Address of the device
  Serial.print("ESP8266 MAC Address: ");
  Serial.println(WiFi.macAddress());
  
  // Initialize ESP-NOW
  if (esp_now_init() != 0) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  
  // Register the send callback
  esp_now_register_send_cb(OnDataSent);
  
  // Register the receive callback
  esp_now_register_recv_cb(OnDataRecv);
  
  // Add the peer
  esp_now_set_self_role(ESP_NOW_ROLE_COMBO);
  esp_now_add_peer(peerMAC, ESP_NOW_ROLE_COMBO, 1, NULL, 0);

}

void loop() {
  // Handle web requests
  server.handleClient();
}

// Third fix - Update the sendDataESP function:
void sendDataESP() {
  // Copy current LED states to the outgoing message
  for (int row = 0; row < 8; row++) {
    for (int col = 0; col < 8; col++) {
      outgoingMessage.ledMatrix[row][col] = ledStates[row][col];
    }
  }
  
  outgoingMessage.counter = millis() / 1000;
  
  // Send the message
  uint8_t result = esp_now_send(peerMAC, (uint8_t *) &outgoingMessage, sizeof(outgoingMessage));
  
  if (result == 0) {
    String jsonResponse = createJsonResponse();
    Serial.println("Message sent successfully");
    Serial.println(jsonResponse);
    server.send(200, "application/json", jsonResponse);
  } else {
    Serial.println("Error sending message");
    server.send(500, "text/plain", "Error sending ESP-NOW message");
  }
}

// Debug endpoint to get system information
void handleDebug() {
  String debugInfo = "Debug Information:\n";
  debugInfo += "WiFi SSID: " + String(ssid) + "\n";
  debugInfo += "IP Address: " + WiFi.localIP().toString() + "\n";
  debugInfo += "Signal Strength: " + String(WiFi.RSSI()) + " dBm\n";
  debugInfo += "Free Heap: " + String(ESP.getFreeHeap()) + " bytes\n";
  
      server.send(200, "text/plain", debugInfo);
}

// Handle brightness adjustment
void handleBrightness() {
  if (server.hasArg("level")) {
    int brightness = server.arg("level").toInt();
    
    // Validate brightness level (0-15)
    if (brightness >= 0 && brightness <= 15) {
      currentBrightness = brightness;
      
      // Set the brightness for the MAX7219
      lc.setIntensity(0, currentBrightness);
      
      DEBUG_SERIAL("Brightness adjusted to: " + String(currentBrightness));
      
      String response = "Brightness set to " + String(currentBrightness);
      server.send(200, "text/plain", response);
    } else {
      DEBUG_SERIAL("Invalid brightness level: " + String(brightness));
      server.send(400, "text/plain", "Invalid brightness level");
    }
  } else {
    DEBUG_SERIAL("No brightness level provided");
    server.send(400, "text/plain", "Missing brightness level");
  }
}

// Function to create JSON response
String createJsonResponse() {
  String json = "{\"ledMatrix\":[";
  
  for (int row = 0; row < 8; row++) {
    json += "[";
    for (int col = 0; col < 8; col++) {
      json += ledStates[row][col] ? "1" : "0";
      if (col < 7) json += ",";
    }
    json += "]";
    if (row < 7) json += ",";
  }
  
  json += "],\"counter\":" + String(outgoingMessage.counter) + "}";
  return json;
}

// Function to serve the homepage with interactive SVG matrix
void handleRoot() {

String html = R"(
<!DOCTYPE html>
<html>
<head>
    <title>LED Matrix Control</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; }
        svg { border: 3px solid #333; margin: 20px; border-radius: 30px; padding: 5px; }
        .led { cursor: pointer; }
        .clear-btn, .debug-btn, .pattern-btn { margin: 10px; padding: 10px; }
        .pattern-btn { display: inline-block; }
    </style>
</head>
<body>
    <h1>Interactive LED Matrix</h1>
    <svg width='400' height='400' viewBox='0 0 8 8'>
        <!-- Grid dynamically generated by Arduino code -->
)";

// Generate SVG grid dynamically
for (int row = 0; row < 8; row++) {
  for (int col = 0; col < 8; col++) {
    // Circle for LED body (larger, darker background)
    html += "<circle class='led-body' cx='" + String(row + 0.5) + "' cy='" + 
            String(7 - col + 0.5) + "' r='0.45' fill='#666' />";

    // Circle for LED light (smaller, illuminated part)
    html += "<circle class='led' cx='" + String(row + 0.5) + "' cy='" + 
            String(7 - col + 0.5) + "' r='0.4' fill='#999999' " +
            "onclick='toggleLed(" + String(row) + "," + String(col) + ")'/>";
  }
}

html += R"(
    </svg>
    <br>
    <button class='clear-btn' onclick='clearMatrix()'>Clear Matrix</button>
    <button class='debug-btn' onclick='showDebug()'>Show Debug Info</button>
    <br>
    <div class='pattern-btn'>
        <button onclick='applyPattern("checkerboard")'>Checkerboard</button>
        <button onclick='applyPattern("diagonal")'>Diagonal</button>
        <button onclick='applyPattern("border")'>Border</button>
        <button onclick='sendData()'>Send Data</button>
    </div>
    <br><br>
    <label for='brightnessSlider'>Brightness: </label>
    <input type='range' id='brightnessSlider' min='0' max='15' value='7' onchange='adjustBrightness()'>
    <span id='brightnessValue'>7</span>
    <div id='brightnessInfo'></div>
    <div id='debugInfo'></div>
    <script>
        


// Update the JavaScript function to handle JSON response
function sendData() {
    fetch('/data')
        .then(response => response.json())
        .then(result => {
            console.log("Data sent successfully:", result);
            // Update debug info with formatted JSON
            document.getElementById('debugInfo').innerHTML = 
                '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
        })
        .catch(err => {
            console.error("Error sending data: ", err);
            document.getElementById('debugInfo').innerHTML = 
                '<pre>Error sending data: ' + err.message + '</pre>';
        });
}

        function adjustBrightness() {
            const slider = document.getElementById('brightnessSlider');
            const valueDisplay = document.getElementById('brightnessValue');
            valueDisplay.textContent = slider.value;

            fetch(`/brightness?level=${slider.value}`)
                .then(response => response.text())
                .then(result => {
                    document.getElementById('brightnessInfo').textContent = result;
                });
        }

        function toggleLed(row, col) {
            fetch(`/toggle?row=${row}&col=${col}`)
                .then(response => response.text())
                .then(state => {
                    const leds = document.getElementsByClassName('led');
                    const index = row * 8 + col;
                    leds[index].style.fill = state === 'ON' ? 'red' : '#999999';
                });
        }

        function clearMatrix() {
            fetch('/clear')
                .then(() => {
                    const leds = document.getElementsByClassName('led');
                    for (let led of leds) {
                        led.style.fill = '#999999';
                    }
                });
        }

        function showDebug() {
            fetch('/debug')
                .then(response => response.text())
                .then(debugText => {
                    document.getElementById('debugInfo').innerHTML = 
                        '<pre>' + debugText + '</pre>';
                });
        }

        function applyPattern(pattern) {
            fetch(`/pattern?type=${pattern}`)
                .then(() => {
                    const leds = document.getElementsByClassName('led');
                    // Update LED display based on pattern
                    switch (pattern) {
                        case 'checkerboard':
                            for (let row = 0; row < 8; row++) {
                                for (let col = 0; col < 8; col++) {
                                    const index = row * 8 + col;
                                    leds[index].style.fill = (row + col) % 2 === 0 ? 'red' : '#999999';
                                }
                            }
                            break;
                        case 'diagonal':
                            for (let row = 0; row < 8; row++) {
                                for (let col = 0; col < 8; col++) {
                                    const index = row * 8 + col;
                                    leds[index].style.fill = row === col ? 'red' : '#999999';
                                }
                            }
                            break;
                        case 'border':
                            for (let row = 0; row < 8; row++) {
                                for (let col = 0; col < 8; col++) {
                                    const index = row * 8 + col;
                                    const isBorder = row === 0 || row === 7 || col === 0 || col === 7;
                                    leds[index].style.fill = isBorder ? 'red' : '#999999';
                                }
                            }
                            break;
                    }
                });
        }
    </script>
</body>
</html>
)";

  server.send(200, "text/html", html);
}

// Function to toggle a specific LED
void handleToggle() {
  if (server.hasArg("row") && server.hasArg("col")) {
    int row = server.arg("row").toInt();
    int col = server.arg("col").toInt();
    
    // Validate input
    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      // Toggle LED state
      ledStates[row][col] = !ledStates[row][col];
      
      // Debug log
      DEBUG_SERIAL("LED Toggled: [" + String(row) + "][" + String(col) + 
                   "] - State: " + (ledStates[row][col] ? "ON" : "OFF"));
      
      // Update physical LED matrix
      lc.setLed(0, row, col, ledStates[row][col]);
      
      // Send response back to client
      server.send(200, "text/plain", ledStates[row][col] ? "ON" : "OFF");
    } else {
      DEBUG_SERIAL("Invalid LED coordinates");
      server.send(400, "text/plain", "Invalid LED coordinates");
    }
  } else {
    DEBUG_SERIAL("Missing row or col parameter");
    server.send(400, "text/plain", "Missing parameters");
  }
}

void applyPattern(const String &pattern) {
  handleClear();
  for (int row = 0; row < 8; row++) {
    for (int col = 0; col < 8; col++) {
      if (pattern == "checkerboard" && (row + col) % 2 == 0) {
        lc.setLed(0, row, col, true);
        ledStates[row][col] = 1;
      } else if (pattern == "diagonal" && row == col) {
        lc.setLed(0, row, col, true);
        ledStates[row][col] = 1;
      } else if (pattern == "border" && (row == 0 || row == 7 || col == 0 || col == 7)) {
        lc.setLed(0, row, col, true);
        ledStates[row][col] = 1;
      }
    }
  }
}

// Function to clear the entire matrix
void handleClear() {
  DEBUG_SERIAL("Clearing entire matrix");
  
  // Clear physical LED matrix
  lc.clearDisplay(0);
  
  // Reset LED states
  for (int row = 0; row < 8; row++) {
    for (int col = 0; col < 8; col++) {
      ledStates[row][col] = false;
    }
  }
  
  server.send(200, "text/plain", "Matrix Cleared");
}

// Helper function to print LED matrix states
void printLedMatrix() {
  for (int row = 0; row < 8; row++) {
    for (int col = 0; col < 8; col++) {
      Serial.print(ledStates[row][col] ? "1 " : "0 ");
    }
    Serial.println();
  }
}

