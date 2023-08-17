#ifndef RUDDERPROPULSION_H
#define RUDDERPROPULSION_H

#include <Servo.h>

class RudderPropulsion{
  public: 
  RudderPropulsion(int _en, int _in1, int _in2, int _rudder);
  void initPins();

  void stop();

  void setSpeed(int newSpeed);
  void setDirection(int newDirection);
  void runTestSequence();
  void moveLeft(int speedPercentage);
  void moveRight(int speedPercentage);
  
  
private:

  void translateToMotors(int speed, int direction);
  void moveMotor(int pin1,int pin2, int speedPercentage,int minPwm, int maxPwm);

  private:
    int en;
    int in1;
    int in2;
    int rudder;
    Servo* myServo;

    int currentSpeed = 0;
    int currentDirection = 0;

    void moveMotor(int pin1,int pin2,int speed);
};

#endif
