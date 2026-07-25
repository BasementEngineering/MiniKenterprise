#ifndef WIFI_H
#define WIFI_H

#include "Config.h"
#include "Settings.h"
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266mDNS.h>

#define DEBUG

// How long a Station-mode connection attempt gets before falling back to AP mode
#define STATION_CONNECT_TIMEOUT 30000

// How often to leave a fallback AP session and try Station mode again, in case the
// home network that failed to answer earlier has since come back
#define STATION_RETRY_INTERVAL 30000

bool wifiOnline = false;
unsigned long lastWifiUpdate = 0;
int nextWaitInterval = 1000;
int attemptCounter = 0;
unsigned long stationAttemptStart = 0;
unsigned long lastStationRetryCheck = 0;

// Reflects the mode actually running right now, which can differ from
// settings.apMode after a Station-connect-timeout fallback to AP.
bool apModeActive = true;

IPAddress local_IP(1,2,3,4);
IPAddress gateway(1,2,3,4);
IPAddress subnet(255,255,255,0);
int myChannel = 1;

// "Public" functions
void Wifi_setupAp();
void startMdns();
void Wifi_update();
bool Wifi_online();
bool Wifi_connected();
bool Wifi_hasClient();
bool Wifi_isApMode();
bool Wifi_shouldRetryStation();
void Wifi_resetStationAttempt();
int Wifi_getQualityPercentage();

//To find a good Wifi Channel
#define CHANNEL_CNT 14
uint8_t ap_count[CHANNEL_CNT] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
int32_t max_rssi[CHANNEL_CNT] = {-100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100};
#define SCAN_DURATION 10000;

void clearData();
void scanWiFi();
void processScanData(int n);
void printWifiNetwork(int i);
void printScanData();
int findEmptyChannel();
int findLowestRssiChannel();
int getBestChannel();
void startStation();
void startAp();

void Wifi_setup(){
  scanWiFi();
  myChannel = getBestChannel();
  #ifdef DEBUG
  Serial.print("Best WiFi Cahnnel: ");Serial.println(myChannel);
  #endif
  apModeActive = settings.apMode;
}

void Wifi_start(){
  if( (millis() - lastWifiUpdate) > nextWaitInterval){
    lastWifiUpdate = millis();
    // wifi_set_sleep_type(NONE_SLEEP_T) fixes websocket disconnects in station mode -
    // the modem-sleep power saving the ESP8266 SDK defaults to otherwise interferes
    // with keeping a live connection.
    wifi_set_sleep_type(NONE_SLEEP_T);
    if(settings.apMode){
      startAp();
    }
    else{
      startStation();
    }
  //startMdns();
  }
}

bool Wifi_connected(){
  if(apModeActive){
    return WiFi.softAPgetStationNum();
  }
  else{
    return WiFi.isConnected();
  }
}

void startStation(){
  if(attemptCounter == 0){
    WiFi.disconnect();
    WiFi.mode(WIFI_STA);
    WiFi.begin(settings.staSsid, settings.staPassword);
    attemptCounter++;
    stationAttemptStart = millis();
  }

  if(WiFi.status() == WL_CONNECTED){
    apModeActive = false;
    wifiOnline = true;
    return;
  }

  if( (millis() - stationAttemptStart) > STATION_CONNECT_TIMEOUT){
    Serial.println("Station connect timed out, falling back to AP mode");
    attemptCounter = 0;
    startAp();
  }
}

void startAp(){
    WiFi.disconnect();
    WiFi.mode(WIFI_AP);
    Serial.print("Setting soft-AP configuration ... ");
    Serial.println(WiFi.softAPConfig(local_IP, gateway, subnet) ? "Ready" : "Failed!");
    WiFi.softAP(settings.apSsid, settings.apPassword, myChannel, false, MAX_WIFI_CONNECTIONS);
    #ifdef DEBUG
      Serial.print("Access Point \"");
      Serial.print(settings.apSsid);
      Serial.println("\" started");
      Serial.print("IP address:\t");
      Serial.println(WiFi.softAPIP());
    #endif
    apModeActive = true;
    wifiOnline = true;
    // Restart the retry countdown from here, whether this is the initial fallback or a
    // failed retry that landed back in AP mode - either way the next retry is a full
    // STATION_RETRY_INTERVAL away.
    lastStationRetryCheck = millis();
}

// Call when (re-)entering the Station-connect attempt, so a fresh WiFi.begin() actually
// happens instead of immediately hitting a stale stationAttemptStart left over from a
// previous cycle (which would time out on the very next check without ever retrying).
void Wifi_resetStationAttempt(){
  attemptCounter = 0;
  apModeActive = settings.apMode;
}

bool Wifi_isApMode(){
  return apModeActive;
}

// Whether it's time to leave a fallback AP session and try Station mode again. Only true
// when the user actually wants Station mode (settings.apMode false) but we're currently
// running AP as a fallback, and nobody is connected through that AP right now - retrying
// tears the AP down (WiFi.mode(WIFI_STA) in startStation()), which would disconnect anyone
// currently controlling the boat through it.
bool Wifi_shouldRetryStation(){
  if(settings.apMode) return false;
  if(!apModeActive) return false;
  if(Wifi_hasClient()) return false;
  if( (millis() - lastStationRetryCheck) < STATION_RETRY_INTERVAL) return false;
  lastStationRetryCheck = millis();
  return true;
}

void startMdns(){
  if (!MDNS.begin(settings.apSsid, WiFi.softAPIP())) {
    Serial.println("mDNS setup failed");
  } else {
    Serial.println("mDNS online at http://"+String(settings.apSsid)+".local");
    MDNS.addService("http", "tcp", 80);
  }
}

void Wifi_update(){
  MDNS.update();
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
  //unsigned long scanStartTime = millis();
  //while( (millis() - scanStartTime) > SCAN_DURATION){
    int n = WiFi.scanNetworks();
    processScanData(n);
    delay(100);
  //}
}

void processScanData(int n){
  
  for (int i = 0; i < n; i++) {
    int32_t channel = WiFi.channel(i);
    int32_t rssi = WiFi.RSSI(i);

    ap_count[channel - 1]++;
    if (rssi > max_rssi[channel - 1]) {
      max_rssi[channel - 1] = rssi;
    }
   }
}

void printWifiNetwork(int i){
   Serial.print(WiFi.SSID(i));
   Serial.print('(');
   Serial.print(WiFi.RSSI(i));
   Serial.print(')');
   if (WiFi.encryptionType(i) == ENC_TYPE_NONE) {
      Serial.print('*');
    }
    Serial.println();
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
