#ifndef LIGHTBAR_H
#define LIGHTBAR_H

#include <Adafruit_NeoPixel.h>

enum MODES{SOLID,LOADING};
#define BLUE 0x34d8eb
#define YELLOW 0xebe234

class LightBar{
  public: 
    LightBar(uint8_t count, uint8_t pin);
    void initLeds();
    void update();
    void setMainColor(uint32_t color);
    void setMainColor(uint8_t r,uint8_t g,uint8_t b);
    void setMode(uint8_t newMode);

  private:
    uint32_t userColor = 0;
    Adafruit_NeoPixel ledStrip;
    bool updateRequired = false;
    uint8_t mode = SOLID;
};

#endif
