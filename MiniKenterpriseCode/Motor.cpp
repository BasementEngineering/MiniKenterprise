#include "Motor.h"

Motor::Motor(int _en, int _in1, int _in2, int _minPwm, int _maxPwm){
  en = _en;
  in1 = _in1;
  in2 = _in2;
  minPwm = _minPwm;
  maxPwm = _maxPwm;
}

void Motor::initPins(){
  pinMode(en,OUTPUT);
  
  pinMode(in1,OUTPUT);
  pinMode(in2,OUTPUT);

  stop();
}

void Motor::enable(){
  digitalWrite(en,HIGH);
}

void Motor::disable(){
  digitalWrite(en,LOW);
}

void Motor::update(){
  if((millis() - lastUpdate) > updateInterval){
    lastUpdate = millis();
    float deltaPwm = (float)(maxPwm*updateInterval)/responseTime;
    float nextStep = 0;
    if(targetPwm > (currentPwm+deltaPwm) ){
      //Serial.println("Adding");
      nextStep = currentPwm + deltaPwm;
    }
    else if(targetPwm < (currentPwm-deltaPwm) ){
      //Serial.println("Subtracting");
      nextStep = currentPwm - deltaPwm;
    }
    else{
      nextStep = targetPwm;
    }
    
    if(currentPwm != targetPwm){
      moveMotor((int)nextStep);
      #ifdef DEBUG_MOTOR
      Serial.print("nextStep");
      Serial.println(nextStep);
      Serial.print("delta PWM");
      Serial.println(deltaPwm);
      Serial.print("Current PWM");
      Serial.println(currentPwm);
      Serial.print("Target PWM");
      Serial.println(targetPwm);
      #endif
    }
    
    currentPwm = nextStep;
  }
}

bool Motor::targetReached(){
  return currentPwm == targetPwm;
}

void Motor::stop(){
  currentPwm = 0;
  targetPwm = 0;
  digitalWrite(in1,LOW);
  digitalWrite(in2,LOW);
}

void Motor::setPower(int newPower){
  if(!polarity){
    newPower = -newPower;
  }
  
  if((newPower >= -100) && (newPower <= 100)){
    targetPwm = powerToPwm(newPower,minPwm,maxPwm);
  }
  else{
  targetPwm = 0;
  }

  #ifdef DEBUG_MOTOR
      Serial.println("Motor::setPower()");
      Serial.print("newPower: ");
      Serial.println(newPower);
      Serial.print("targetPwm ");
      Serial.println(targetPwm);
  #endif
}

int Motor::getPower(){
  return pwmToPower(currentPwm,minPwm,maxPwm);
}

int Motor::getTargetPower(){
  return pwmToPower(targetPwm,minPwm,maxPwm);
}

int Motor::powerToPwm(int power, int minPwm, int maxPwm){
  if(power == 0){
    return 0;
  }
  int magnitude = (((maxPwm-minPwm)*abs(power))/100)+minPwm;
  return (power > 0) ? magnitude : -magnitude;
}

int Motor::pwmToPower(int pwm, int minPwm, int maxPwm){
  if(pwm == 0){
    return 0;
  }
  int power = ((abs(pwm)-minPwm)*100)/(maxPwm-minPwm);
  return (pwm > 0) ? power : -power;
}

void Motor::moveMotor(int pwm){
  //digitalWrite(en,HIGH);

  if(pwm > 255){
    pwm = 255;
  }
  else if(pwm < -255){
    pwm = -255;  
  }
  
  if(pwm > 0){
    digitalWrite(in1,LOW);
    analogWrite(in2,pwm);
  }
  else if(pwm < 0){
    analogWrite(in1,-pwm);
    digitalWrite(in2,LOW);
  }
  else{
    digitalWrite(in1,LOW);
    digitalWrite(in2,LOW);
  }
}
