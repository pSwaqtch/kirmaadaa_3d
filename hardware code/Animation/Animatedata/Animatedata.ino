#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <LedControl.h>

const char* ssid = "MM GIRLS HOSTEL ROOM 501";
const char* password = "Room@501";

ESP8266WebServer server(80);

// Pins for MAX7219
#define DATA_IN_PIN 14
#define LOAD_PIN 12
#define CLOCK_PIN 13

LedControl lc = LedControl(DATA_IN_PIN, CLOCK_PIN, LOAD_PIN, 1); // 1 device connected

// Initialize matrix using bytes (8 bits per row)
void displayMatrix(byte matrix[8]) {
    for (int row = 0; row < 8; row++) {
        // Extract the bit of the matrix row corresponding to each column
        for (int col = 0; col < 8; col++) {
            // Use bitwise AND to check if the bit at position `col` is set
            bool ledState = matrix[row] & (1 << col);
            lc.setLed(0, row, col, !ledState);
        }
    }
}

// Handle CORS headers
void handleCORS() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    if (server.method() == HTTP_OPTIONS) {
        server.send(200, "text/plain", "");
        return;
    }
}

// Handle upload of the matrix data
void handleUpload() {
    handleCORS();
    
    Serial.println("Received upload request");
    
    if (server.hasArg("plain")) {
        String json = server.arg("plain");
        Serial.println("Received JSON:");
        Serial.println(json);
        
        StaticJsonDocument<16384> doc;
        DeserializationError error = deserializeJson(doc, json);

        if (error) {
            String errorMsg = String("JSON Error: ") + error.c_str();
            Serial.println(errorMsg);
            server.send(400, "text/plain", errorMsg);
            return;
        }

        Serial.println("JSON parsed successfully");

        // Get matrix data from the JSON
        JsonArray framesArray = doc["data"].as<JsonArray>();
        
        for (JsonArray frameData : framesArray) {
            // Assuming each frame has slices with 8x8 matrices
            for (JsonArray sliceData : frameData) {
                byte matrix[8] = {0};  // Each row is a byte, initialize to 0
                
                // Convert the received binary matrix data to an array of bytes
                for (int row = 0; row < 8; row++) {
                    JsonArray rowData = sliceData[row].as<JsonArray>();
                    byte rowByte = 0;
                    for (int col = 0; col < 8; col++) {
                        // Set the bit for the column based on the LED state (0 or 1)
                        if (rowData[col].as<int>() == 1) {
                            rowByte |= (1 << col);
                        }
                    }
                    matrix[row] = rowByte;  // Store the byte for the row
                }

                // Display the matrix on the LED matrix
                displayMatrix(matrix);
                delay(500);  // Delay for 500ms before showing the next matrix
                
                lc.clearDisplay(0); // Clear the display
            }
        }

        server.send(200, "text/plain", "Data received and displayed");
    } else {
        server.send(400, "text/plain", "No data received");
    }
}

void setup() {
    Serial.begin(74880);
    
    WiFi.begin(ssid, password);
    Serial.print("\nConnecting to WiFi");
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    Serial.println("\nConnected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    server.on("/upload", HTTP_OPTIONS, handleCORS);
    server.on("/upload", HTTP_POST, handleUpload);
    
    server.begin();
    lc.shutdown(0, false);  // Wake up the MAX7219
    lc.clearDisplay(0); 
    Serial.println("Server started");
}

void loop() {
    server.handleClient();
}
