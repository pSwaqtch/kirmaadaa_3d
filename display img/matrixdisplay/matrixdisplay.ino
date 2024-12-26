#include <LedControl.h>
#include <LittleFS.h> // File system for ESP8266/ESP32

// Pin connections for the LedControl library (DIN, CLK, CS)
#define DATA_PIN D7
#define CLK_PIN D6
#define CS_PIN D8

// Initialize LedControl for a single 8x8 LED matrix
LedControl matrix = LedControl(DATA_PIN, CLK_PIN, CS_PIN, 1);

// Constants for file and delay
const char filePath[] PROGMEM = "/wieframe_cube_mtx.txt";
const int sliceDelay = 500; // Delay in milliseconds between slices

void setup() {
  Serial.begin(115200);

  // Initialize LED matrix
  matrix.shutdown(0, false);  // Wake up the display
  matrix.setIntensity(0, 5);  // Set brightness (0-15)
  matrix.clearDisplay(0);     // Clear the display

  // Initialize LittleFS
  if (!LittleFS.begin()) {
    Serial.println(F("File system initialization failed!"));
    while (true); // Halt execution if LittleFS fails
  }

  // Display the slices from the file
  displaySlices();
}

void loop() {
  // The loop is intentionally left empty
}

// Function to display slices read from the file
void displaySlices() {
  File file = LittleFS.open(FPSTR(filePath), "r"); // Use FPSTR to access flash-stored file path
  if (!file) {
    Serial.println(F("Failed to open the file!"));
    return;
  }

  byte data[8]; // Array to store one 8x8 slice
  int row = 0;

  while (file.available()) {
    String line = file.readStringUntil('\n');
    line.trim(); // Remove unnecessary whitespace

    if (line.startsWith("[Slice")) {
      // Reset for the next slice
      row = 0;
      memset(data, 0, sizeof(data)); // Clear the data array
      continue;
    }

    if (line.length() == 15) { // Check valid row length (8 numbers, 7 spaces)
      for (int col = 0; col < 8; col++) {
        if (line[col * 2] == '1') { // Check bit value in the line
          data[row] |= (1 << (7 - col)); // Set the corresponding bit
        }
      }
      row++;
    }

    // Display the slice once all rows are filled
    if (row == 8) {
      displaySlice(data);
      delay(sliceDelay); // Add delay between slices
    }
  }

  file.close();
}

// Function to update the LED matrix for a single slice
void displaySlice(byte data[8]) {
  for (int row = 0; row < 8; row++) {
    for (int col = 0; col < 8; col++) {
      bool ledState = (data[row] & (1 << (7 - col))) != 0; // Extract bit for LED state
      matrix.setLed(0, row, col, ledState);               // Update LED state
    }
  }
}
