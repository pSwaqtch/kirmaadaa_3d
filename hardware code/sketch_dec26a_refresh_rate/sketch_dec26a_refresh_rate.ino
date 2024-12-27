#include <LedControl.h>

#define DATA_PIN 14
#define CS_PIN   12 
#define CLK_PIN  13

LedControl lc = LedControl(DATA_PIN, CLK_PIN, CS_PIN, 1);

const int MIN_DELAY = 0;     // Minimum delay in ms
const int MAX_DELAY = 300;    // Starting delay in ms
int speedIncrement = 30;      // Starting speed increment, will decrease

void setup() {
  Serial.begin(74880);
  Serial.println("Starting LED Matrix Demo");
  
  lc.shutdown(0, false);
  lc.setIntensity(0, 8);
  lc.clearDisplay(0);
}

void loop() {
  static int currentDelay = MAX_DELAY;
  
  for(int col = 0; col < 8; col++) {
    Serial.print("Column: ");
    Serial.print(col);
    Serial.print(" Delay: ");
    Serial.print(currentDelay);
    Serial.print(" Increment: ");
    Serial.println(speedIncrement);
    
    lc.clearDisplay(0);
    
    for(int row = 0; row < 8; row++) {
      lc.setLed(0, row, col, true);
    }
    
    delay(currentDelay);
  }
  
  if(currentDelay > MIN_DELAY) {
    currentDelay -= speedIncrement;
    // Gradually reduce the increment itself
    if(speedIncrement > 1) {
      speedIncrement = max(1, speedIncrement - 2);
    }
  } else {
    currentDelay = MAX_DELAY;
    speedIncrement = 4;  // Reset increment
    Serial.println("Resetting speed");
  }
}