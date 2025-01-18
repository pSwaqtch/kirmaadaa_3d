const int hallPin = 5;  // GPIO pin connected to the hall sensor
volatile int pulseCount = 0;  // Counts the pulses from the hall sensor
unsigned long lastPulseTime = 0;
unsigned long debounceTime = 10;  // Debounce time in milliseconds
unsigned long lastTime = 0;
unsigned long sampleTime = 1000;  // Sampling time in milliseconds (1 second)

void IRAM_ATTR handlePulse() {
  unsigned long currentTime = millis();
  
  // Debounce: ignore pulses too close to each other
  if (currentTime - lastPulseTime > debounceTime) {
    pulseCount++;  // Increments pulse count on each valid interrupt
    lastPulseTime = currentTime;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(hallPin, INPUT);
  attachInterrupt(digitalPinToInterrupt(hallPin), handlePulse, RISING);
}

void loop() {
  unsigned long currentTime = millis();
  
  // Every 1 second, calculate RPM
  if (currentTime - lastTime >= sampleTime) {
    detachInterrupt(hallPin);  // Disable interrupt temporarily to read pulseCount safely
    float rpm = (pulseCount / 2.0) * 60.0;  // Adjust based on pulses per rotation
    Serial.print("RPM: ");
    Serial.println(rpm);

    pulseCount = 0;  // Reset pulse count
    lastTime = currentTime;  // Update time
    attachInterrupt(digitalPinToInterrupt(hallPin), handlePulse, RISING);  // Re-enable interrupt
  }
}
