#ifndef PROPULSIONSYSTEM_H
#define PROPULSIONSYSTEM_H

#include "Motor.h"

class PropulsionSystem{
  public:
  PropulsionSystem(int _en, int _in1, int _in2, int _in3, int _in4);
  void initPins();

  void stop();
  void update();

  void setSpeed(int newSpeed);
  void setDirection(int newDirection);
  void moveLeft(int speedPercentage);
  void moveRight(int speedPercentage);


private:

  void translateToMotors(int speed, int direction);

  private:
    Motor leftMotor;
    Motor rightMotor;

    int currentSpeed = 0;
    int currentDirection = 0;
};

#endif
