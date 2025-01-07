// motor_control.h
#ifndef MOTOR_CONTROL_H
#define MOTOR_CONTROL_H

#include <Servo.h>
#include "include/config.h"

extern Servo esc;
extern int currentSpeed;
extern int targetSpeed;
extern volatile unsigned long count;
extern int rpm;

void setupMotor();
void calibrateESC();
void smoothSpeedTransition();
void ICACHE_RAM_ATTR countWhiteStripe();

#endif
