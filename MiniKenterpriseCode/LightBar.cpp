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
  if(timingActive && ((millis()-lastUpdated) > updateInterval)){
    updateRequired = true;
    lastUpdated = millis();
  }
  
  if(updateRequired){
    switch(mode){
      case SOLID:
        ledStrip.fill(userColor);
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

  for(int i = 0; i < ledStrip.numPixels(); i++){
          int x = 0;
          if(i > 0){
            x = ((float)MAX_STEPS/ledStrip.numPixels()) * (float)i;
          }
          //Serial.print("currentStep");Serial.print(": ");Serial.println(currentStep);
          //Serial.print("x");Serial.print(": ");Serial.println(x);
          float value =  (-0.002*((x-currentStep)*(x-currentStep))) + 1.0 ;
          //Serial.print(i);Serial.print(":");Serial.println(value);
          if(value < 0){
            value = 0;
          }
          //Serial.print(i);Serial.print(":");Serial.println(value);
          ledStrip.setPixelColor(i,dimColor(userColor,value));
        }
        
   effectCounter++;
}

void LightBar::updateBlinking(){
  const int MAX_STEPS = 100;
  int currentStep = 0;
  effectCounter %= MAX_STEPS;

  if(effectCounter > MAX_STEPS/2){
    ledStrip.fill(userColor);
  }
  else{
    ledStrip.fill(0);
  }
  ledStrip.show();

   effectCounter++;
}

uint32_t LightBar::dimColor(uint32_t color, float factor){
  uint8_t red = (color>>16)*factor;
  uint8_t green = ((color>>8) & 255) *factor;
  uint8_t blue = ((color>>0) & 255)*factor;
  /*Serial.println("Factor");
  Serial.println(factor);
  Serial.println("Colors");
  Serial.println(red);
  Serial.println(green);
  Serial.println(blue);
*/
  return ledStrip.Color(red,green,blue);
}
