#include "LightBar.h"

LightBar::LightBar(uint8_t count):
ledStrip(count)
{
  userColor = YELLOW;
}

void LightBar::initLeds(){
  ledStrip.Begin();
  ledStrip.Show();
  ledStrip.SetBrightness(50);
  ledStrip.ClearTo(RgbColor(HtmlColor(userColor)));
  ledStrip.Show();
}

void LightBar::update(){
  if(timingActive && ((millis()-lastUpdated) > updateInterval)){
    updateRequired = true;
    lastUpdated = millis();
  }

  if(updateRequired){
    switch(mode){
      case SOLID:
        ledStrip.ClearTo(RgbColor(HtmlColor(userColor)));
        break;
      case KNIGHT_RIDER:
        updateKnightRider();
        break;
      case BLINKING:
        updateBlinking();
        break;
      default: break;
    }
    updateRequired = false;
    ledStrip.Show();
  }
}

void LightBar::setMainColor(uint32_t color){
  userColor = color;
  updateRequired = true;
}

void LightBar::setMainColor(uint8_t r,uint8_t g,uint8_t b){
  userColor = ((uint32_t)r << 16) | ((uint32_t)g << 8) | b;
  updateRequired = true;
}

void LightBar::setMode(uint8_t newMode){
  mode = newMode;
  if(mode == SOLID){
    timingActive = false;
    updateRequired = true;
  }
  else{
    timingActive = true;
  }
  effectCounter = 0;
}

void LightBar::updateKnightRider(){
  const int MAX_STEPS = 70;
  int currentStep = 0;
  effectCounter %= MAX_STEPS*2;
  if(effectCounter > MAX_STEPS){
    currentStep = MAX_STEPS - (effectCounter - MAX_STEPS);
   }
  else{
    currentStep = effectCounter;
  }

  for(int i = 0; i < ledStrip.PixelCount(); i++){
          int x = 0;
          if(i > 0){
            x = ((float)MAX_STEPS/ledStrip.PixelCount()) * (float)i;
          }
          float value =  (-0.002*((x-currentStep)*(x-currentStep))) + 1.0 ;
          if(value < 0){
            value = 0;
          }
          ledStrip.SetPixelColor(i,RgbColor(HtmlColor(dimColor(userColor,value))));
        }

   effectCounter++;
}

void LightBar::updateBlinking(){
  const int MAX_STEPS = 100;
  int currentStep = 0;
  effectCounter %= MAX_STEPS;

  if(effectCounter > MAX_STEPS/2){
    ledStrip.ClearTo(RgbColor(HtmlColor(userColor)));
  }
  else{
    ledStrip.ClearTo(RgbColor(0,0,0));
  }
  ledStrip.Show();

   effectCounter++;
}

uint32_t LightBar::dimColor(uint32_t color, float factor){
  uint8_t red = (color>>16)*factor;
  uint8_t green = ((color>>8) & 255) *factor;
  uint8_t blue = ((color>>0) & 255)*factor;
  return ((uint32_t)red << 16) | ((uint32_t)green << 8) | blue;
}
