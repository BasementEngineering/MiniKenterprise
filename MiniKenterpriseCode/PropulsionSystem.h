#ifndef PROPULSIONSYSTEM_H
#define PROPULSIONSYSTEM_H

#include "Motor.h"
#include "Config.h" // PwmLimitBand

enum BoostState{BOOST_READY, BOOST_ACTIVE, BOOST_COOLDOWN};

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

  // Called every tick the frontend's boost button is held - level-triggered rather than
  // edge-triggered, since it already no-ops outside BOOST_READY, and level-triggering is more
  // robust against a dropped WebSocket packet than trying to catch a single 0->1 transition.
  void requestBoost();
  BoostState getBoostState();
  int getBoostSecondsRemaining();

  // True only when both motors are confirmed to be delivering exactly zero power right now
  // (post soft-start/stop ramp, not just commanded to stop) - used to gate when a battery
  // reading is trustworthy as a no-load (rested) voltage sample. See Battery.h.
  bool isIdle();


private:

  void translateToMotors(int speed, int direction);

  // Applies percent as the new PWM ceiling on both motors and immediately re-issues the last
  // commanded speed against it - otherwise the motors would keep driving at the stale
  // pre-change PWM until the next incoming control packet happens to arrive.
  void applyPwmLimit(uint8_t percent);

  // Looks up the PWM-limit band (regular/boost percentages) matching the battery's current
  // no-load voltage - see Config.h's pwmLimitBands.
  PwmLimitBand getCurrentPwmLimitBand();

  private:
    Motor leftMotor;
    Motor rightMotor;

    int currentSpeed = 0;
    int currentDirection = 0;

    int lastLeftSpeedPercent = 0;
    int lastRightSpeedPercent = 0;

    BoostState boostState = BOOST_READY;
    unsigned long boostStateChangedAt = 0;
};

#endif
