#include "LightBar.h"

LightBar::LightBar(uint8_t count, uint8_t pin):
ledStrip(count, pin, NEO_GRB + NEO_KHZ800)
{
  userColor = YELLOW;
}

void LightBar::initLeds(){
  ledStrip.begin();
  ledStrip.show();
  ledStrip.setBrightness(50);
  ledStrip.fill(userColor);
  ledStrip.show();
}

void LightBar::update(){
  if(updateRequired){
    switch(mode){
      case SOLID:
        ledStrip.fill(userColor);
    }
    updateRequired = false;
    ledStrip.show();
  }
}

void LightBar::setMainColor(uint32_t color){
  userColor = color;
  updateRequired = true;
}

void LightBar::setMainColor(uint8_t r,uint8_t g,uint8_t b){
  userColor = ledStrip.Color(r,g,b);
  updateRequired = true;
}
    
void LightBar::setMode(uint8_t newMode){
  mode = newMode;
}
