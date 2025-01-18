#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <ESP32Servo.h>

// WiFi credentials
const char* ssid = "lifeline_2.4GHz";       // Replace with your WiFi SSID
const char* password = "dwarkesh@501";      // Replace with your WiFi password

// Web server and WebSocket
WebServer server(80);
WebSocketsServer webSocket(81);

// ESC control
Servo esc;
const int escPin = 19; // PWM pin connected to the ESC signal wire (update as per your wiring)
int currentSpeed = 1000; // Current speed in µs
int targetSpeed = 1000;  // Target speed in µs
const int speedStep = 10; // Step size for smooth transitions
const int stepDelay = 50; // Delay (ms) between each step

// IR sensor for RPM measurement
#define IR_PIN 18  // GPIO pin for IR sensor (update as per your wiring)
volatile unsigned long irCount = 0;
unsigned long lastIrMillis = 0;
int irRpm = 0;
int irDivisor = 2;  // Adjust this based on the number of pulses per rotation for IR sensor

// Hall sensor for RPM measurement
#define HALL_PIN 5  // GPIO pin for Hall sensor (update as per your wiring)
#define HALL_DEBOUNCE_DELAY 10 // Debounce delay for Hall sensor in milliseconds
volatile unsigned long lastHallPulseTime = 0; // To track the time of the last pulse
volatile unsigned long hallCount = 0;
unsigned long lastHallMillis = 0;
int hallRpm = 0;
int hallDivisor = 2;  // Adjust this based on the number of pulses per rotation for Hall sensor

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
    #speedValue, #irRpmValue, #hallRpmValue { font-size: 1.5em; margin: 10px; }
    #slider { width: 80%; max-width: 300px; }
  </style>
</head>
<body>
  <h1>ESC Speed Control & RPM</h1>
  <p>Use the slider below to control the motor speed:</p>
  <input type="range" id="slider" min="1000" max="2000" value="1000">
  <p>Current Speed: <span id="speedValue">1000</span> µs</p>
  <p>IR Sensor RPM: <span id="irRpmValue">0</span></p>
  <p>Hall Sensor RPM: <span id="hallRpmValue">0</span></p>
  <script>
    const slider = document.getElementById('slider');
    const speedValue = document.getElementById('speedValue');
    const irRpmValue = document.getElementById('irRpmValue');
    const hallRpmValue = document.getElementById('hallRpmValue');
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
        .then(response => response.json())
        .then(data => {
          irRpmValue.textContent = data.irRpm;
          hallRpmValue.textContent = data.hallRpm;
        });
    }, 1000);
  </script>
</body>
</html>
)rawliteral";

// ISR for IR sensor RPM calculation
void IRAM_ATTR countIrPulse() {
  irCount++;
}

// ISR for Hall sensor RPM calculation with debounce
void IRAM_ATTR countHallPulse() {
  unsigned long currentTime = millis();
  
  // Check if the time between pulses is greater than debounce delay
  if (currentTime - lastHallPulseTime > HALL_DEBOUNCE_DELAY) {
    hallCount++; // Increment the pulse count for Hall sensor
    lastHallPulseTime = currentTime; // Update the last pulse time
  }
}

void setup() {
  Serial.begin(115200);

  // ESC setup using ESP32Servo library
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
  server.on("/rpm", []() {
    String jsonData = "{\"irRpm\":" + String(irRpm) + ",\"hallRpm\":" + String(hallRpm) + "}";
    server.send(200, "application/json", jsonData);
  });
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
  Serial.println("IR Sensor RPM Measurer");
  pinMode(IR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(IR_PIN), countIrPulse, FALLING);

  // Hall sensor setup
  Serial.println("Hall Sensor RPM Measurer");
  pinMode(HALL_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(HALL_PIN), countHallPulse, FALLING);
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

  // RPM calculation for IR sensor
  if (millis() - lastIrMillis >= 1000) {
    noInterrupts();
    irRpm = (irCount * 60) / irDivisor;
    irCount = 0;
    interrupts();
    lastIrMillis = millis();
    Serial.printf("IR Sensor RPM: %d\n", irRpm);
  }

  // RPM calculation for Hall sensor
  if (millis() - lastHallMillis >= 1000) {
    noInterrupts();
    hallRpm = (hallCount * 60) / hallDivisor;
    hallCount = 0;
    interrupts();
    lastHallMillis = millis();
    Serial.printf("Hall Sensor RPM: %d\n", hallRpm);
  }
}
