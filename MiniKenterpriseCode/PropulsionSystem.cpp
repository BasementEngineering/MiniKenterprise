#include "PropulsionSystem.h"
#include <Arduino.h>

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

void PropulsionSystem::moveLeft(int speed){
  moveMotor(in1,in2,speed);
}

void PropulsionSystem::moveRight(int speed){
  moveMotor(in3,in4,speed);
}

void PropulsionSystem::moveMotor(int pin1,int pin2, int speed){
  digitalWrite(en,HIGH);
  if(speed < 0){
    speed = -speed;
    digitalWrite(pin1,LOW);
    analogWrite(pin2,speed);
  }
  else{
    digitalWrite(pin2,LOW);
    analogWrite(pin1,speed);
  }
}

void PropulsionSystem::stop(){
  digitalWrite(en,LOW);
  
  digitalWrite(in1,LOW);
  digitalWrite(in2,LOW);
  digitalWrite(in3,LOW);
  digitalWrite(in4,LOW);
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
