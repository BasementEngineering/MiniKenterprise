#ifndef PROPULSIONSYSTEM_H
#define PROPULSIONSYSTEM_H

class PropulsionSystem{
  public: 
  PropulsionSystem(int _en, int _in1, int _in2, int _in3, int _in4);
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
    int in3;
    int in4;

    int currentSpeed = 0;
    int currentDirection = 0;

    void moveMotor(int pin1,int pin2,int speed);
};

#endif
