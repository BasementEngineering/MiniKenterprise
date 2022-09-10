#include "PropulsionSystem.h"
#include <Arduino.h>
#include "Config.h"

//#define DEBUG_PROPULSION

PropulsionSystem::PropulsionSystem(int _en, int _in1, int _in2, int _in3, int _in4){
  en = _en;
  in1 = _in1;
  in2 = _in2;
  in3 = _in3;
  in4 = _in4;
}

void PropulsionSystem::initPins(){
  pinMode(en,OUTPUT);
  
  pinMode(in1,OUTPUT);
  pinMode(in2,OUTPUT);
  pinMode(in3,OUTPUT);
  pinMode(in4,OUTPUT);

  stop();
}

void PropulsionSystem::moveLeft(int speedPercentage){
  moveMotor(in1,in2,speedPercentage,MIN_PWM_L,MAX_PWM_L);
}

void PropulsionSystem::moveRight(int speedPercentage){
  moveMotor(in3,in4,speedPercentage,MIN_PWM_R,MAX_PWM_R);
}

void PropulsionSystem::moveMotor(int pin1,int pin2, int speedPercentage,int minPwm, int maxPwm){
  digitalWrite(en,HIGH);
  uint8_t pwm = 0;
  if(speedPercentage == 0){
    pwm=0;
    digitalWrite(pin1,LOW);
    analogWrite(pin2,LOW);
  }
  else if(speedPercentage > 0){
    pwm = ((maxPwm-minPwm)*speedPercentage)/100;
    digitalWrite(pin1,LOW);
    analogWrite(pin2,pwm);
  }
  else if(speedPercentage < 0){
    pwm = ((maxPwm-minPwm)*(-speedPercentage))/100;
    digitalWrite(pin1,pwm);
    analogWrite(pin2,LOW);
  }
}

void PropulsionSystem::stop(){
  digitalWrite(en,LOW);
  
  digitalWrite(in1,LOW);
  digitalWrite(in2,LOW);
  digitalWrite(in3,LOW);
  digitalWrite(in4,LOW);
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
      leftSpeed = ((100+direction)*speedPercentage)/100;
      rightSpeed = speedPercentage;
    }
    else if(direction > 0){
      leftSpeed = speedPercentage;
      rightSpeed = ((100-direction)*speedPercentage)/100;
    }
    #ifdef DEBUG_PROPULSION
    Serial.print("Left Speed: ");Serial.println(leftSpeed);
    Serial.print("Right Speed: ");Serial.println(rightSpeed);
    #endif

    moveLeft(leftSpeed);
    moveRight(rightSpeed);
  }
  
}

void PropulsionSystem::runTestSequence(){
  Serial.println("Testing Left");
  for( int i = 0; i<255; i++){
      Serial.print("Left Forward: ");
      Serial.println(i);
      moveLeft(i);
      delay(50);
  }
  delay(1000);
  moveLeft(0);
  delay(1000);
  for( int i = 0; i>-255; i--){
    Serial.print("Left Reverse: ");
    Serial.println(i);
    moveLeft(i);
    delay(50);
  }
  delay(1000);
  moveLeft(0);
  delay(1000);

    for( int i = 0; i<255; i++){
      Serial.print("Right Forward: ");
      Serial.println(i);
      moveRight(i);
      delay(50);
  }
  delay(1000);
  moveRight(0);
  delay(1000);
  for( int i = 0; i>-255; i--){
    Serial.print("Right Reverse: ");
    Serial.println(i);
    moveRight(i);
    delay(50);
  }
  delay(1000);
  moveRight(0);
  delay(1000);
}
