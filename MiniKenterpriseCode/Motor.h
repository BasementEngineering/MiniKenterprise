#ifndef MOTOR_H
#define MOTOR_H

#include <Arduino.h>

class Motor{
  public:
  Motor(int _en, int _in1, int _in2, int _minPwm, int _maxPwm);
  void initPins();
  void update();
  bool targetReached();

  void enable();
  void disable();
  
  void setPower(int newPower); //Sets target
  int getPower(); //Delivers actual current output power
  void resetValues(){stop();}
  
  int getTargetPower();
  
  void stop();

  void setResponseTime(unsigned int timeMs) {
  responseTime = min(max(1U, timeMs), 2000U);
}
  unsigned int getResponseTime(){return responseTime;}
  
  void setPolarity(bool newPolarity){polarity = newPolarity;}
  bool getPolarity(){return polarity;}
   
  private:
    int en;
    int in1;
    int in2;

    int maxPwm;
    int minPwm;

    // true = normal wiring, power sign maps directly to pwm sign.
    // Only flip to false via setPolarity() for a motor wired backwards.
    bool polarity = true;
    unsigned int updateInterval = 20;

    int currentDirection = 0; //1 = forward, 0 = stop, -1 = backward
    float currentPwm = 0.0; //Percentage
    int targetPwm = 0;

    unsigned int responseTime = 1000;
    unsigned long lastUpdate = 0;

    void moveMotor(int pwm);
    int powerToPwm(int power, int minPwm, int maxPwm);
    int pwmToPower(int pwm, int minPwm, int maxPwm);
};

#endif
