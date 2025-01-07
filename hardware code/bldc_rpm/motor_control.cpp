// motor_control.cpp
#include "include/motor_control.h"

Servo esc;
int currentSpeed = MIN_SPEED;
int targetSpeed = MIN_SPEED;
volatile unsigned long count = 0;
int rpm = 0;

void setupMotor() {
    esc.attach(ESC_PIN, MIN_SPEED, MAX_SPEED);
    pinMode(IR_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(IR_PIN), countWhiteStripe, FALLING);
}

void calibrateESC() {
    Serial.println("Starting ESC calibration...");

    // Step 1: Maximum throttle
    Serial.println("Step 1: Sending maximum throttle");
    esc.writeMicroseconds(MAX_SPEED);
    delay(5000);

    // Step 2: Minimum throttle
    Serial.println("Step 2: Sending minimum throttle");
    esc.writeMicroseconds(MIN_SPEED);
    delay(3000);

    Serial.println("ESC calibration complete");
}

void smoothSpeedTransition() {
    if (currentSpeed < targetSpeed) {
        currentSpeed = min(currentSpeed + SPEED_STEP, targetSpeed);
    } else if (currentSpeed > targetSpeed) {
        currentSpeed = max(currentSpeed - SPEED_STEP, targetSpeed);
    }
    esc.writeMicroseconds(currentSpeed);
    Serial.printf("Current speed: %d µs\n", currentSpeed);
}

void ICACHE_RAM_ATTR countWhiteStripe() {
    count++;
}
