#ifndef WIFI_H
#define WIFI_H

#include "Config.h"
#include <ESP8266WiFi.h>
#include <WiFiClient.h>

const char *ssid = APSSID;
const char *password = APPSK;

bool wifiOnline = false;

void Wifi_setupAp(); // to open a wifi access point
bool Wifi_online(){
  return wifiOnline;
}

bool Wifi_hasClient(){
  return  WiFi.softAPgetStationNum();
}

int Wifi_getQualityPercentage(){
  //if (WiFi.status() != WL_CONNECTED)
    //return -1;
  int dBm = WiFi.RSSI();
  if (dBm <= -100){
    return 0;
  }
  else if (dBm >= -50){
    return 100;
  }
  else{
    return 2 * (dBm + 100);
  }
}


unsigned long lastWifiUpdate = 0;
int nextWaitInterval = 1000;
int attemptCounter = 0;

IPAddress local_IP(1,2,3,4);
IPAddress gateway(1,2,4,1);
IPAddress subnet(255,255,255,0);
#define DEBUG
void Wifi_setupAp(){
  if( (millis() - lastWifiUpdate) > nextWaitInterval){
    lastWifiUpdate = millis();
  #ifdef AP_MODE
    Serial.print("Setting soft-AP configuration ... ");
    //Serial.println(WiFi.softAPConfig(local_IP, gateway, subnet) ? "Ready" : "Failed!");
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

#endif
