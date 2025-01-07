// config.cpp
#include "include/config.h"

// Define available networks in order of preference
const WiFiNetwork WIFI_NETWORKS[] = {
    {"lifeline_2.4GHz", "dwarkesh@501"},    // PG network
    {"21:02:44", ""}         // Mobile hotspot as last resort
};
const int NETWORK_COUNT = sizeof(WIFI_NETWORKS) / sizeof(WIFI_NETWORKS[0]);

// webpage.h
#ifndef WEBPAGE_H
#define WEBPAGE_H

extern const char* WEBPAGE;

#endif
