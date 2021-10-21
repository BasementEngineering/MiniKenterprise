#define MOTOR_EN 16
#define MOTOR_IN1 2
#define MOTOR_IN2 14
#define MOTOR_IN3 4
#define MOTOR_IN4 5

#define LED_PIN 12
//D0 -> GPIO16
//D4 -> GPIO2
//D5 -> GPIO14
//D2 -> GPIO4
//D1 -> GPIO5
//D6 -> GPIO12
// Do not use GPIO 0 aka. D3, FLASHING Pin

#include "PropulsionSystem.h"
PropulsionSystem propulsionSystem(MOTOR_EN,MOTOR_IN1,MOTOR_IN2,MOTOR_IN3,MOTOR_IN4);

#include <Adafruit_NeoPixel.h>
#define LED_COUNT 5
Adafruit_NeoPixel ledStrip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include "backend.h"

#define APSSID "KenterpriseWiFi"
#define APPSK  "RowYourBoat"
#define AP_MODE

const char *ssid = APSSID;
const char *password = APPSK;

void setupWifiAp(){
  Serial.begin(9600);
  delay(1000);
  #ifdef AP_MODE
  WiFi.softAP(ssid, password);
  #ifdef DEBUG
  Serial.print("Access Point \"");
  Serial.print(ssid);
  Serial.println("\" started");
  Serial.print("IP address:\t");
  Serial.println(WiFi.softAPIP());         // Send the IP address of the ESP8266 to the computer
  #endif
  #endif
  #ifndef AP_MODE
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.waitForConnectResult() != WL_CONNECTED) {
    delay(5000);
    ESP.restart();
  }
  #endif
}

void testMotors(){
  Serial.println("Testing Left");
  for( int i = 0; i<255; i++){
      Serial.print("Left Forward: ");
      Serial.println(i);
    	propulsionSystem.moveLeft(i);
      delay(50);
  }
  delay(1000);
  propulsionSystem.moveLeft(0);
  delay(1000);
  for( int i = 0; i>-255; i--){
    Serial.print("Left Reverse: ");
    Serial.println(i);
    propulsionSystem.moveLeft(i);
    delay(50);
  }
  delay(1000);
  propulsionSystem.moveLeft(0);
  delay(1000);

    for( int i = 0; i<255; i++){
      Serial.print("Right Forward: ");
      Serial.println(i);
      propulsionSystem.moveRight(i);
      delay(50);
  }
  delay(1000);
  propulsionSystem.moveRight(0);
  delay(1000);
  for( int i = 0; i>-255; i--){
    Serial.print("Right Reverse: ");
    Serial.println(i);
    propulsionSystem.moveRight(i);
    delay(50);
  }
  delay(1000);
  propulsionSystem.moveRight(0);
  delay(1000);
}

void setup(){

  Serial.begin(9600);
  Serial.println("Starting Setup");
  propulsionSystem.initPins();
  Serial.println("Testing motors...");
  //testMotors();
  setupWifiAp();
  ledStrip.begin();
  ledStrip.show();
  setupBackend(&propulsionSystem,&ledStrip);
  Serial.println("Ready");
}

uint8_t pwmValue = 200;

void loop(){
  updateBackend();
  yield();
}
