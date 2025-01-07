// config.h
#ifndef CONFIG_H
#define CONFIG_H

// WiFi credentials structure
struct WiFiNetwork {
    const char* ssid;
    const char* password;
};

extern const WiFiNetwork WIFI_NETWORKS[];
extern const int NETWORK_COUNT;

// Pin definitions
#define ESC_PIN D1
#define IR_PIN D3

// ESC configuration
#define MIN_SPEED 1000
#define MAX_SPEED 2000
#define SPEED_STEP 10
#define STEP_DELAY 75

// RPM configuration
#define RPM_DIVISOR 2

#endif
