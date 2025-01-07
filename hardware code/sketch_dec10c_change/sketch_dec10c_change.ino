#include <espnow.h>
#include <ESP8266WiFi.h>

// Replace with the MAC Address of the other ESP8266
uint8_t peerMAC[] = {0xD8, 0xF1, 0x5B, 0x10, 0x7C, 0x42};

// Define a structure to hold the message
typedef struct message_t {
  char text[32];
  int counter;
} message_t;

message_t outgoingMessage;
message_t incomingMessage;

// Callback when data is sent
void OnDataSent(uint8_t *mac_addr, uint8_t sendStatus) {
  Serial.print("Data Send Status: ");
  if (sendStatus == 0) {
    Serial.println("Success");
  } else {
    Serial.println("Fail");
  }
}

// Callback when data is received
void OnDataRecv(uint8_t *mac, uint8_t *incomingData, uint8_t len) {
  memcpy(&incomingMessage, incomingData, sizeof(incomingMessage));
  Serial.print("Received message: ");
  Serial.println(incomingMessage.text);
  Serial.print("Counter: ");
  Serial.println(incomingMessage.counter);
}

void setup() {
  Serial.begin(74880);
  
  // Set device as a Wi-Fi station
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
  // Prepare outgoing message
  strcpy(outgoingMessage.text, "Hello from Krupal");
  outgoingMessage.counter = millis() / 1000;
  
  // Send the message to the peer
  esp_now_send(peerMAC, (uint8_t *) &outgoingMessage, sizeof(outgoingMessage));
  Serial.println("Message sent");
  
  // Wait before sending the next message
  delay(2000);
}