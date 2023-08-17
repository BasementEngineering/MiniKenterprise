#include "RudderPropulsion.h"
#include <Arduino.h>
#include "Config.h"

//#define DEBUG_PROPULSION

RudderPropulsion::RudderPropulsion(int _en, int _in1, int _in2, int _rudder)
{
  en = _en;
  in1 = _in1;
  in2 = _in2;
  rudder = _rudder;
  myServo = new Servo;
}

void RudderPropulsion::initPins(){
  pinMode(en,OUTPUT);
  
  pinMode(in1,OUTPUT);
  pinMode(in2,OUTPUT);
  pinMode(rudder,OUTPUT);

  //myServo->attach(rudder);

  stop();
}

void RudderPropulsion::moveLeft(int speedPercentage){
  moveMotor(in1,in2,speedPercentage,MIN_PWM_L,MAX_PWM_L);
}

void RudderPropulsion::moveRight(int speedPercentage){
  //moveMotor(in3,in4,speedPercentage,MIN_PWM_R,MAX_PWM_R);
}

void RudderPropulsion::moveMotor(int pin1,int pin2, int speedPercentage,int minPwm, int maxPwm){
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

void RudderPropulsion::stop(){
  digitalWrite(en,LOW);
  
  digitalWrite(in1,LOW);
  digitalWrite(in2,LOW);
  myServo->detach();
}

void RudderPropulsion::setSpeed(int newSpeed){
  currentSpeed = newSpeed;
  translateToMotors(currentSpeed,currentDirection);
}

void RudderPropulsion::setDirection(int newDirection){
  currentDirection = newDirection;
  translateToMotors(currentSpeed,currentDirection);
}

void RudderPropulsion::translateToMotors(int speedPercentage, int direction){
  myServo->attach(rudder);

  int servoAngle = 90 + ((direction*90)/100);
  myServo->write(servoAngle);
  moveMotor(in1,in2,speedPercentage,MIN_PWM_L,MAX_PWM_L);
}

void RudderPropulsion::runTestSequence(){
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
