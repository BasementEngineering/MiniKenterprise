#ifndef LIGHTBAR_H
#define LIGHTBAR_H

#include <NeoPixelBrightnessBus.h>

enum MODES{SOLID,KNIGHT_RIDER,BLINKING};
#define BLUE 0x34d8eb
#define YELLOW 0xfa8600

class LightBar{
  public:
    LightBar(uint8_t count);
    void initLeds();
    void update();
    void setMainColor(uint32_t color);
    void setMainColor(uint8_t r,uint8_t g,uint8_t b);
    void setMode(uint8_t newMode);

  private:
    // Drives the strip via the ESP8266's UART1 hardware (fixed to its TX pin, GPIO2) instead of
    // bit-banging - Adafruit_NeoPixel's show() disabled interrupts for its whole duration on
    // ESP8266, a known cause of soft-AP/WiFi instability. The UART's own hardware-clocked FIFO
    // paces the bit timing instead, so interrupts stay enabled throughout. GPIO2 was already
    // this project's default LED pin (Config.h), and nothing else here uses UART1/Serial1, so
    // this needed no rewiring and doesn't collide with Serial (which is UART0, GPIO1/GPIO3).
    NeoPixelBrightnessBus<NeoGrbFeature, NeoEsp8266AsyncUart1800KbpsMethod> ledStrip;
    uint32_t userColor = 0;
    uint8_t mode = SOLID;
    bool updateRequired = false;
    unsigned long lastUpdated = 0;
    int effectCounter = 0;
    bool timingActive = false;
    // Back to the original 10ms - the UART1 method above doesn't disable interrupts, so the
    // WiFi-stability reason for throttling this to 30ms no longer applies.
    int updateInterval = 10;

    void updateKnightRider();
    void updateBlinking();
    uint32_t dimColor(uint32_t color, float factor);
};

#endif
