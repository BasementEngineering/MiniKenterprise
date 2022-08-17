#ifndef LIGHTBAR_H
#define LIGHTBAR_H

#include <Adafruit_NeoPixel.h>

enum MODES{SOLID,KNIGHT_RIDER,BLINKING};
#define BLUE 0x34d8eb
#define YELLOW 0xfa8600

class LightBar{
  public: 
    LightBar(uint8_t count, uint8_t pin);
    void initLeds();
    void update();
    void setMainColor(uint32_t color);
    void setMainColor(uint8_t r,uint8_t g,uint8_t b);
    void setMode(uint8_t newMode);

  private:
    Adafruit_NeoPixel ledStrip;
    uint32_t userColor = 0;
    uint8_t mode = SOLID;
    bool updateRequired = false;
    unsigned long lastUpdated = 0;
    int effectCounter = 0;
    bool timingActive = false;
    int updateInterval = 10;

    void updateKnightRider();
    void updateBlinking();;
    uint32_t dimColor(uint32_t color, float factor);
};

#endif
