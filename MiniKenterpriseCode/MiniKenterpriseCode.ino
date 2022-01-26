#include "Config.h"
#include "PropulsionSystem.h"
#include "LightBar.h"
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include "backend.h"

PropulsionSystem propulsionSystem(MOTOR_EN,MOTOR_IN1,MOTOR_IN2,MOTOR_IN3,MOTOR_IN4);
LightBar lightBar(LED_COUNT, LED_PIN);

const char *ssid = APSSID;
const char *password = APPSK;

//helper function decalarations (full implementations are further down)
bool wifiOnline = false;
void setupWifiAp(); // to open a wifi access point

void setup(){
  Serial.begin(9600);
  Serial.println("Starting Setup");
  propulsionSystem.initPins();
  lightBar.initLeds();
  lightBar.setMode(KNIGHT_RIDER);
  //lightBar.update();

  Serial.println("Starting Backend");
  setupBackend(&propulsionSystem,&lightBar);
  Serial.println("Ready");
}

void loop(){
  if(wifiOnline){
    updateBackend();
  } else{
    setupWifiAp();
  }
  lightBar.update();
  yield();
}

unsigned long lastWifiUpdate = 0;
int nextWaitInterval = 1000;
int attemptCounter = 0;

void setupWifiAp(){
  if( (millis() - lastWifiUpdate) > nextWaitInterval){
    lastWifiUpdate = millis();
  #ifdef AP_MODE
    WiFi.softAP(ssid, password);
    #ifdef DEBUG
      Serial.print("Access Point \"");
      Serial.print(ssid);
      Serial.println("\" started");
      Serial.print("IP address:\t");
      Serial.println(WiFi.softAPIP());
    #endif
    wifiOnline = true;
  #endif
  #ifndef AP_MODE
    if(attemptCounter == 0){
      WiFi.mode(WIFI_STA);
      WiFi.begin(ssid, password);
      attemptCounter++;
    }
    if(attemptCounter > 0){
      if(WiFi.waitForConnectResult() == WL_CONNECTED){
        wifiOnline = true;
      }
      else{
        ESP.restart();
      }
    }
  #endif
  }
  
}
