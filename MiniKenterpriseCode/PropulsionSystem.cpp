#include "PropulsionSystem.h"
#include <Arduino.h>
#include "Config.h"

#define DEBUG_PROPULSION

PropulsionSystem::PropulsionSystem(int _en, int _in1, int _in2, int _in3, int _in4)
  : leftMotor(_en, _in1, _in2, MIN_PWM_L, MAX_PWM_L),
    rightMotor(_en, _in3, _in4, MIN_PWM_R, MAX_PWM_R){
}

void PropulsionSystem::initPins(){
  leftMotor.initPins();
  rightMotor.initPins();
}

void PropulsionSystem::update(){
  leftMotor.update();
  rightMotor.update();
}

void PropulsionSystem::moveLeft(int speedPercentage){
  leftMotor.enable();
  leftMotor.setPower(speedPercentage);
}

void PropulsionSystem::moveRight(int speedPercentage){
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
