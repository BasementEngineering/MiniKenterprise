#ifndef BATTERY_H
#define BATTERY_H
#include "Config.h"

//#define DEBUG_BATTERY

struct TableEntry
{
    int voltageMv;
    int percentage;
};

#define TABLE_LENGTH 18
TableEntry batteryLookUpTable[TABLE_LENGTH] = {
    { 2500, 0 },
    { 2600, 1 },
    { 2700, 2 },
    { 2800, 3 },
    { 2900, 5 },
    { 3000, 7 },
    { 3100, 10 },
    { 3200, 15 },
    { 3300, 27 },
    { 3400, 46 },
    { 3500, 59 },
    { 3600, 69 },
    { 3700, 79 },
    { 3800, 90 },
    { 3900, 98 },
    { 4000, 100 },
    { 4100, 100 },
    { 4200, 100 }
};

void Battery_init(){
  pinMode(A0, INPUT);
}

unsigned long lastBatteryUpdate = 0;
#define BATTERY_BUFFER_LENGTH 10
int readings[BATTERY_BUFFER_LENGTH];
int readingsPosition = 0;

void Battery_update(){
  if((millis()-lastBatteryUpdate) > 50){
    lastBatteryUpdate=millis();
    int sensorValue = analogRead(A0);
    readings[readingsPosition] = sensorValue;
    readingsPosition++;
    readingsPosition %= BATTERY_BUFFER_LENGTH;
  }
}

int getReadingAvg(){
  unsigned long sum = 0;
  #ifdef DEBUG_BATTERY
  Serial.print("[");
  #endif
  for( int i = 0; i < BATTERY_BUFFER_LENGTH; i++){
    sum += readings[i];
    #ifdef DEBUG_BATTERY
    Serial.print(readings[i]);Serial.print(",");
    #endif
  }
  #ifdef DEBUG_BATTERY
  Serial.println("]");
  #endif
  return (sum/BATTERY_BUFFER_LENGTH);
}

#define CORRECTION_FACTOR 4.8198
int toVoltage(int reading){
  return reading * CORRECTION_FACTOR;
}

int toPercentage(int voltageMv){
  
  if(voltageMv > 4200){
    return 100;
  }
  else if(voltageMv < 2500){
    return 0;
  }
  else{
    int rest = voltageMv%100;
    voltageMv = voltageMv - rest;
    for(int i = 0; i < TABLE_LENGTH; i++){
      if( voltageMv == batteryLookUpTable[i].voltageMv){
        return batteryLookUpTable[i].percentage;
      }
    }
  }
  return 0;
}

int Battery_getPercentage(){
  int avgReading = getReadingAvg();
  int voltageMv = toVoltage(avgReading);
  #ifdef DEBUG_BATTERY
  Serial.println("Battery:");
  Serial.print("avgReading: ");Serial.println(avgReading); 
  Serial.print("voltageMv: ");Serial.println(voltageMv); 
  Serial.print("percentage: ");Serial.println(toPercentage(voltageMv)); 
  #endif
  return toPercentage(voltageMv);
}

bool Battery_isCritical(){
  return Battery_getPercentage() < 20;
}

#endif
