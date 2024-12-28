#include <LedControl.h>
#include <LittleFS.h> // File handling library

// Pin connections for LedControl (DIN, CLK, CS)
#define DATA_PIN D7
#define CLK_PIN D6
#define CS_PIN D8

LedControl matrix = LedControl(DATA_PIN, CLK_PIN, CS_PIN, 1); // Single 8x8 matrix

// Store constant strings in flash memory to reduce RAM usage
const char fileError[] PROGMEM = "Failed to open file!";
const char fsError[] PROGMEM = "File system initialization failed!";

void setup() {
  Serial.begin(115200);

  // Initialize the LED matrix
  matrix.shutdown(0, false);       // Wake up the matrix
  matrix.setIntensity(0, 5);       // Set brightness (0-15)
  matrix.clearDisplay(0);          // Clear the display

  // Initialize the File System
  if (!LittleFS.begin()) {
    Serial.println(FPSTR(fsError)); // Read string from flash
    while (true);
  }

  // Display matrix from file
  displayMatrixFromFile();
}

void loop() {
  // Nothing to do in the loop
}

void displayMatrixFromFile() {
  File file = LittleFS.open("/matrix.txt", "r");
  if (!file) {
    Serial.println(FPSTR(fileError)); // Read string from flash
    return;
  }

  byte data[8] = {0};  // Array to hold the binary matrix data
  int row = 0;

  while (file.available() && row < 8) {
    String line = file.readStringUntil('\n'); // Read one line
    line.trim();                             // Remove extra spaces or newlines

    if (line.length() == 8) {
      byte value = 0;
      for (int col = 0; col < 8; col++) {
        if (line[col] == '1') {
          value |= (1 << (7 - col)); // Convert binary string to byte
        }
      }
      data[row] = value;
      row++;
    }
  }
  file.close();

  // Update the LED matrix
  for (int i = 0; i < 8; i++) {
    for (int j = 0; j < 8; j++) {
      bool ledState = (data[i] & (1 << (7 - j))) != 0; // Extract bit for each LED
      matrix.setLed(0, i, j, ledState);               // Set LED state
    }
  }
}
