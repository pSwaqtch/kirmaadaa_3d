#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WebSocketsServer.h>
#include <Servo.h>

// WiFi credentials
const char* ssid = "lifeline_2.4GHz";       // Replace with your WiFi SSID
const char* password = "dwarkesh@501"; // Replace with your WiFi password

// Web server and WebSocket
ESP8266WebServer server(80);
WebSocketsServer webSocket(81);

// ESC control
Servo esc;
const int escPin = D1; // PWM pin connected to the ESC signal wire
int currentSpeed = 1500; // Current speed in µs
int targetSpeed = 1500;  // Target speed in µs
const int speedStep = 10; // Step size for smooth transitions
const int stepDelay = 50; // Delay (ms) between each step

// IR sensor for RPM measurement
#define IR_PIN D5  // GPIO14 (D5 on NodeMCU)
volatile unsigned long count = 0;
unsigned long lastMillis = 0;
int rpm = 0;
int divisor = 1;

// Webpage as a string
const char* webpage = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ESC Speed & RPM</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
    #speedValue, #rpmValue { font-size: 1.5em; margin: 10px; }
    #slider { width: 80%; max-width: 300px; }
  </style>
</head>
<body>
  <h1>ESC Speed Control & RPM</h1>
  <p>Use the slider below to control the motor speed:</p>
  <input type="range" id="slider" min="1000" max="2000" value="1500">
  <p>Current Speed: <span id="speedValue">1500</span> µs</p>
  <p>Current RPM: <span id="rpmValue">0</span></p>
  <script>
    const slider = document.getElementById('slider');
    const speedValue = document.getElementById('speedValue');
    const rpmValue = document.getElementById('rpmValue');
    const ws = new WebSocket('ws://' + location.host + ':81');

    slider.addEventListener('input', () => {
      speedValue.textContent = slider.value;
      ws.send(slider.value);
    });

    ws.onopen = () => console.log('WebSocket connected');
    ws.onclose = () => console.log('WebSocket disconnected');
    ws.onerror = error => console.error('WebSocket error:', error);

    setInterval(() => {
      fetch('/rpm')
        .then(response => response.text())
        .then(data => rpmValue.textContent = data);
    }, 1000);
  </script>
</body>
</html>
)rawliteral";

// ISR for RPM calculation
ICACHE_RAM_ATTR void countWhiteStripe() {
  count++;
}

void setup() {
  Serial.begin(74880);

  // ESC setup
  esc.attach(escPin, 1000, 2000); // Attach ESC to pin with a range of 1000-2000 µs

  Serial.println("Starting ESC calibration...");

  // Step 1: Set throttle to maximum
  Serial.println("Step 1: Sending maximum throttle (2000 µs).");
  esc.writeMicroseconds(2000); // Send maximum pulse width
  delay(5000); // Wait for ESC to detect maximum throttle

  // Step 2: Set throttle to minimum
  Serial.println("Step 2: Sending minimum throttle (1000 µs).");
  esc.writeMicroseconds(1000); // Send minimum pulse width
  delay(3000); // Wait for ESC to detect minimum throttle

  Serial.println("ESC calibration complete. Ready to use.");

  // WiFi setup
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  Serial.println(WiFi.localIP());

  // Web server setup
  server.on("/", []() { server.send(200, "text/html", webpage); });
  server.on("/rpm", []() { server.send(200, "text/plain", String(rpm)); });
  server.begin();
  webSocket.begin();

  // WebSocket event handler
  webSocket.onEvent([](uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    if (type == WStype_TEXT) {
      targetSpeed = atoi((char*)payload);
      Serial.printf("Target speed set to %d µs\n", targetSpeed);
    }
  });

  // IR sensor setup
  Serial.print("\n\nESP8266 RPM Measurer");
  pinMode(IR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(IR_PIN), countWhiteStripe, FALLING);
}

void smoothSpeedTransition() {
  if (currentSpeed < targetSpeed) {
    currentSpeed = min(currentSpeed + speedStep, targetSpeed);
  } else if (currentSpeed > targetSpeed) {
    currentSpeed = max(currentSpeed - speedStep, targetSpeed);
  }
  esc.writeMicroseconds(currentSpeed);
  Serial.printf("Current speed: %d µs\n", currentSpeed);
}

void loop() {
  server.handleClient();
  webSocket.loop();

  // Smooth speed transition
  if (currentSpeed != targetSpeed) {
    smoothSpeedTransition();
    delay(stepDelay);
  }

  // RPM calculation
  if (millis() - lastMillis >= 1000) {
    noInterrupts();
    rpm = (count * 60) / divisor;
    count = 0;
    interrupts();
    lastMillis = millis();
    Serial.printf("Current RPM: %d\n", rpm);
  }
}
