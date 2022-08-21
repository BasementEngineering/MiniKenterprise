#ifndef WIFI_H
#define WIFI_H

#include "Config.h"
#include <ESP8266WiFi.h>
#include <WiFiClient.h>

#define DEBUG

const char *ssid = APSSID;
const char *password = APPSK;

bool wifiOnline = false;
unsigned long lastWifiUpdate = 0;
int nextWaitInterval = 1000;
int attemptCounter = 0;

IPAddress local_IP(1,2,3,4);
IPAddress gateway(1,2,3,4);
IPAddress subnet(255,255,255,0);
int myChannel = 1;

// "Public" functions
void Wifi_setupAp();
bool Wifi_online();
bool Wifi_hasClient();
int Wifi_getQualityPercentage();

//To find a good Wifi Channel
#define CHANNEL_CNT 14
uint8_t ap_count[CHANNEL_CNT] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
int32_t max_rssi[CHANNEL_CNT] = {-100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100};

void clearData();
void scanWiFi();
void printScanData();
int findEmptyChannel();
int findLowestRssiChannel();
int getBestChannel();

void Wifi_setup(){
  scanWiFi();
  myChannel = getBestChannel();
  Serial.print("Best WiFi Cahnnel: ");Serial.println(myChannel);
}

void Wifi_startAp(){
  if( (millis() - lastWifiUpdate) > nextWaitInterval){
    lastWifiUpdate = millis();
  #ifdef AP_MODE
    WiFi.disconnect();
    WiFi.mode(WIFI_AP);
    Serial.print("Setting soft-AP configuration ... ");
    Serial.println(WiFi.softAPConfig(local_IP, gateway, subnet) ? "Ready" : "Failed!");
    WiFi.softAP(ssid, password,myChannel,false,MAX_WIFI_CONNECTIONS);
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

void clearData(){
  for(int i = 0; i < CHANNEL_CNT; i++){
    ap_count[i] = 0;
    max_rssi[i] = -100;
  }
}

void scanWiFi(){
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
  
  int n = WiFi.scanNetworks();
  if (n == 0) {
    Serial.println("no networks found");
  } 
  else {
    for (int i = 0; i < n; i++) {
      int32_t channel = WiFi.channel(i);
      int32_t rssi = WiFi.RSSI(i);

      // channel stat
      ap_count[channel - 1]++;
      if (rssi > max_rssi[channel - 1]) {
        max_rssi[channel - 1] = rssi;
      }

      // Print SSID, signal strengh and if not encrypted
      Serial.print(WiFi.SSID(i));
      Serial.print('(');
      Serial.print(rssi);
      Serial.print(')');
      if (WiFi.encryptionType(i) == ENC_TYPE_NONE) {
        Serial.print('*');
      }
      Serial.println();
      delay(10);
    }
  }
}

void printScanData(){
  Serial.println("Wifi Scan Result:");
  Serial.print("AP Count: [");
  for(int i = 0; i < CHANNEL_CNT; i++){
    Serial.print(ap_count[i]);
    if(i < CHANNEL_CNT-1){
      Serial.print(",");
    }
  }
  Serial.println("]");
  
  Serial.print("RSSI: [");
  for(int i = 0; i < CHANNEL_CNT; i++){
    Serial.print(max_rssi[i]);
    if(i < CHANNEL_CNT-1){
      Serial.print(",");
    }
  }
  Serial.println("]");
}

int findEmptyChannel(){
  for(int i = 0; i < CHANNEL_CNT;i++){
    if(ap_count[i] == 0){
      return i+1;
    }
  }
  return -1;
}

int findLowestRssiChannel(){
  int lowestRssi = 0;
  int channel = 1;

  for(int i = 0; i < CHANNEL_CNT;i++){
    if(max_rssi[i] < lowestRssi){
      lowestRssi = max_rssi[i];
      channel = i+1;
    }
  }
  Serial.print("Found lowest RSSI channel: ");Serial.println(channel);
  Serial.print("RSSI:"); Serial.println(lowestRssi);
  return channel;
}

int getBestChannel(){
  int emptyChannel = findEmptyChannel();
  if( emptyChannel != -1){
    return emptyChannel;
  }
  else{
    return findLowestRssiChannel();
  }
}

#endif
