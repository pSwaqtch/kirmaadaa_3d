#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

// Debug macro
#define DEBUG 1
#define DEBUG_SERIAL(x) do { if(DEBUG) { Serial.println(x); } } while(0)

// Pin definitions - Changed to D5
#define IR_PIN D3  // GPIO14 (D5 on NodeMCU)

ESP8266WebServer server(80);

// RPM calculation variables
volatile unsigned long count = 0;  // Changed to unsigned long
unsigned long lastMillis = 0;
int rpm = 0;
int divisor = 1;

// ICACHE_RAM_ATTR is required for ESP8266 interrupts
ICACHE_RAM_ATTR void countWhiteStripe() {
  count++;
}

void setup() {
  Serial.begin(74880);  

  DEBUG_SERIAL("\n\nESP8266 RPM Measurer");
  
  // Configure IR_PIN as input with internal pullup
  pinMode(IR_PIN, INPUT_PULLUP);
  
  // Attach interrupt with FALLING edge
  attachInterrupt(digitalPinToInterrupt(IR_PIN), countWhiteStripe, FALLING);
}

void loop() {
  
  // Calculate RPM every second
  if (millis() - lastMillis >= 1000) {
    noInterrupts();  // Disable interrupts while calculating
    rpm = (count * 60) / divisor;
    count = 0;
    interrupts();    // Re-enable interrupts
    
    lastMillis = millis();
    
    // Debug output
    DEBUG_SERIAL("Current RPM: " + String(rpm));
  }
}

// Function to handle RPM data request
void handleRPM() {
  server.send(200, "text/plain", String(rpm));
}
