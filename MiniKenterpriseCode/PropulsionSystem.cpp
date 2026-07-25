#include "PropulsionSystem.h"
#include <Arduino.h>
#include "Config.h"
#include "Settings.h"

#define DEBUG_PROPULSION

PropulsionSystem::PropulsionSystem(int _en, int _in1, int _in2, int _in3, int _in4)
  : leftMotor(_en, _in1, _in2, MIN_PWM_L, MAX_PWM_L),
    rightMotor(_en, _in3, _in4, MIN_PWM_R, MAX_PWM_R){
}

void PropulsionSystem::initPins(){
  leftMotor.initPins();
  rightMotor.initPins();
  applyPwmLimit(settings.regularPwmLimitPercent);
}

void PropulsionSystem::update(){
  leftMotor.update();
  rightMotor.update();

  if(boostState == BOOST_ACTIVE && (millis() - boostStateChangedAt) > BOOST_DURATION_MS){
    applyPwmLimit(settings.regularPwmLimitPercent);
    boostState = BOOST_COOLDOWN;
    boostStateChangedAt = millis();
  }
  else if(boostState == BOOST_COOLDOWN && (millis() - boostStateChangedAt) > BOOST_COOLDOWN_MS){
    boostState = BOOST_READY;
  }
}

void PropulsionSystem::moveLeft(int speedPercentage){
  lastLeftSpeedPercent = speedPercentage;
  leftMotor.enable();
  leftMotor.setPower(speedPercentage);
}

void PropulsionSystem::moveRight(int speedPercentage){
  lastRightSpeedPercent = speedPercentage;
  rightMotor.enable();
  rightMotor.setPower(speedPercentage);
}

void PropulsionSystem::stop(){
  leftMotor.stop();
  rightMotor.stop();
  leftMotor.disable(); // en is shared between both motors
}

void PropulsionSystem::setSpeed(int newSpeed){
  currentSpeed = newSpeed;
  translateToMotors(currentSpeed,currentDirection);
}

void PropulsionSystem::setDirection(int newDirection){
  currentDirection = newDirection;
  translateToMotors(currentSpeed,currentDirection);
}

void PropulsionSystem::requestBoost(){
  if(boostState == BOOST_READY){
    applyPwmLimit(settings.boostPwmLimitPercent);
    boostState = BOOST_ACTIVE;
    boostStateChangedAt = millis();
  }
}

BoostState PropulsionSystem::getBoostState(){
  return boostState;
}

int PropulsionSystem::getBoostSecondsRemaining(){
  unsigned long durationMs = 0;
  if(boostState == BOOST_ACTIVE){
    durationMs = BOOST_DURATION_MS;
  }
  else if(boostState == BOOST_COOLDOWN){
    durationMs = BOOST_COOLDOWN_MS;
  }
  else{
    return 0;
  }

  long elapsedMs = millis() - boostStateChangedAt;
  long remainingMs = durationMs - elapsedMs;
  if(remainingMs < 0){
    remainingMs = 0;
  }
  return (remainingMs + 999) / 1000; // round up to whole seconds
}

void PropulsionSystem::applyPwmLimit(uint8_t percent){
  leftMotor.setMaxPwm((MAX_PWM_L * percent) / 100);
  rightMotor.setMaxPwm((MAX_PWM_R * percent) / 100);
  // Re-issue the last commanded speed immediately against the new ceiling - setPower() alone
  // (not moveLeft/moveRight) so this doesn't call enable() and assert the shared en pin before
  // a real driving command ever arrives (e.g. at startup, when both are still 0).
  leftMotor.setPower(lastLeftSpeedPercent);
  rightMotor.setPower(lastRightSpeedPercent);
}

void PropulsionSystem::translateToMotors(int speedPercentage, int direction){
  #ifdef DEBUG_PROPULSION
  Serial.print("Current Speed: ");Serial.println(currentSpeed);
  Serial.print("Current Direction: ");Serial.println(currentDirection);
  #endif

  int leftSpeed = 0;
  int rightSpeed = 0;

  if(speedPercentage == 0){
    stop();
  }
  else{
    if(direction == 0){
      leftSpeed = speedPercentage;
      rightSpeed = speedPercentage;
    }
    if(direction < 0){ //Turning Right
      rightSpeed = ((100+direction)*speedPercentage)/100;
      leftSpeed = speedPercentage;
    }
    else if(direction > 0){
      rightSpeed = speedPercentage;
      leftSpeed = ((100-direction)*speedPercentage)/100;
    }
    #ifdef DEBUG_PROPULSION
    Serial.print("Left Speed: ");Serial.println(leftSpeed);
    Serial.print("Right Speed: ");Serial.println(rightSpeed);
    #endif

    moveLeft(leftSpeed);
    moveRight(rightSpeed);
  }

}
