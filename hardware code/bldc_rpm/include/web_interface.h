// web_interface.h
#ifndef WEB_INTERFACE_H
#define WEB_INTERFACE_H

#include <ESP8266WebServer.h>
#include <WebSocketsServer.h>
#include "include/webpage.h"
#include "include/motor_control.h"

extern ESP8266WebServer server;
extern WebSocketsServer webSocket;

void setupWiFi();
void setupWebServer();
void handleWebSocket(uint8_t num, WStype_t type, uint8_t * payload, size_t length);

#endif
