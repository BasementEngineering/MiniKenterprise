#ifndef PROPULSIONSYSTEM_H
#define PROPULSIONSYSTEM_H

class PropulsionSystem{
  public: 
  PropulsionSystem(int _en, int _in1, int _in2, int _in3, int _in4);
  void initPins();

  void moveLeft(int speed);
  void moveRight(int speed);
  void stop();

  void runTestSequence();

  private:
    int en;
    int in1;
    int in2;
    int in3;
    int in4;

    void moveMotor(int pin1,int pin2,int speed);
};

#endif
