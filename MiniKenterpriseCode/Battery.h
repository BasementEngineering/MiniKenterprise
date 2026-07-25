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

unsigned long lastBatteryUpdate = 0;
#define BATTERY_BUFFER_LENGTH 10
int readings[BATTERY_BUFFER_LENGTH];
int readingsPosition = 0;

// Separate, longer-averaged reading of the battery's no-load (rested) voltage - the live
// buffer above sags significantly while the motors are drawing current, so it doesn't reflect
// true state of charge in that moment. Only accumulated while both motors have been confirmed
// idle (see PropulsionSystem::isIdle()) for at least NOLOAD_SETTLE_MS, to let the battery's own
// internal-resistance sag actually recover after load stops before a sample is trusted.
#define NOLOAD_SETTLE_MS 400
#define NOLOAD_BUFFER_LENGTH 20
int noLoadReadings[NOLOAD_BUFFER_LENGTH];
int noLoadReadingsPosition = 0;
bool wasIdle = false;
unsigned long idleSince = 0;

// Conservative default (matches the highest/most restrictive PWM-limit band in Config.h) so
// anything reading this before Battery_init()'s seed sample errs toward assuming a fresh,
// high-voltage battery rather than the floor band. Battery_init() overwrites this with a real
// reading immediately at boot (the boat always starts idle), so this sentinel only matters for
// the brief window before that.
int lastNoLoadVoltageMv = 4200;

#define CORRECTION_FACTOR 4.8198
int toVoltage(int reading){
  return reading * CORRECTION_FACTOR;
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

int getNoLoadReadingAvg(){
  long sum = 0;
  for( int i = 0; i < NOLOAD_BUFFER_LENGTH; i++){
    sum += noLoadReadings[i];
  }
  return (sum/NOLOAD_BUFFER_LENGTH);
}

void Battery_init(){
  pinMode(A0, INPUT);

  // The boat always starts idle, so this is a legitimate real sample, not a placeholder - pre-
  // fill both rolling buffers with it so every getter reports something real from the very
  // first call. Must run before PropulsionSystem::initPins() (see MiniKenterpriseCode.ino's
  // setup()), which does the first PWM-limit-band lookup using the no-load reading immediately.
  int seedReading = analogRead(A0);
  for(int i = 0; i < BATTERY_BUFFER_LENGTH; i++){
    readings[i] = seedReading;
  }
  for(int i = 0; i < NOLOAD_BUFFER_LENGTH; i++){
    noLoadReadings[i] = seedReading;
  }
  lastNoLoadVoltageMv = toVoltage(seedReading);
}

void Battery_update(bool motorsIdle){
  if((millis()-lastBatteryUpdate) > 50){
    lastBatteryUpdate=millis();
    int sensorValue = analogRead(A0);
    readings[readingsPosition] = sensorValue;
    readingsPosition++;
    readingsPosition %= BATTERY_BUFFER_LENGTH;

    if(motorsIdle){
      if(!wasIdle){
        idleSince = millis();
      }
      if( (millis() - idleSince) > NOLOAD_SETTLE_MS ){
        noLoadReadings[noLoadReadingsPosition] = sensorValue;
        noLoadReadingsPosition++;
        noLoadReadingsPosition %= NOLOAD_BUFFER_LENGTH;
        lastNoLoadVoltageMv = toVoltage(getNoLoadReadingAvg());
      }
    }
    wasIdle = motorsIdle;
  }
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
    return 0;
  }
}

// Based on the no-load (rested) voltage, not the live/loaded reading - the live reading sags
// under motor current and doesn't reflect true state of charge, which would otherwise make the
// UI's battery icon flicker/drop while driving even though the battery itself is fine.
int Battery_getPercentage(){
  int voltageMv = lastNoLoadVoltageMv;
  #ifdef DEBUG_BATTERY
  Serial.println("Battery:");
  Serial.print("voltageMv (no-load): ");Serial.println(voltageMv);
  Serial.print("percentage: ");Serial.println(toPercentage(voltageMv));
  #endif
  return toPercentage(voltageMv);
}

int Battery_getVoltageMv(){
  return toVoltage(getReadingAvg());
}

int Battery_getNoLoadVoltageMv(){
  return lastNoLoadVoltageMv;
}

bool Battery_isCritical(){
  return Battery_getPercentage() < 20;
}

#endif
