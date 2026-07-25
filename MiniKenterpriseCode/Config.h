#ifndef CONFIG_H
#define CONFIG_H

/*** Compile-time defaults ***
 * These are only used once, to seed Settings (see Settings.h) the first time
 * the device boots (or after a factory reset). Everything below is
 * runtime-editable afterwards from the on-device settings page - changing a
 * value here only changes what a *fresh* device starts out with.
 */

// Default Access Point credentials (the boat's own network)
#define DEFAULT_AP_SSID "MiniKenterprise_1"
#define DEFAULT_AP_PASSWORD "RowYourBoat"
#define MAX_WIFI_CONNECTIONS 1

// Default Station credentials - left blank; join a network from the settings page
#define DEFAULT_STA_SSID ""
#define DEFAULT_STA_PASSWORD ""

/*! The Pin Markings on the WEMOS D1 Mini Board don't match the GPIO numbers !
 * Do not use GPIO 0 aka. D3 as it is used for flashing programs.
 *
 * GPIO16 aka. D0 lives on the RTC domain instead of the main GPIO controller
 * (its own registers, used for deep-sleep wake), so it can't be used with
 * attachInterrupt(). It has supported analogWrite()/PWM since the earliest
 * ESP8266 Arduino core releases (confirmed back to 2.0.0-rc2) though, so it's
 * fine to use for motor speed control - the "GPIO16 can't do PWM" claim
 * floating around online is a myth.
 *
 * Pinout Table:
 * Wifi Antenna = Top
 * | Left Side        | Right Side    |
 * ------------------------------------
 * | RST      | RST   | TX    | GPIO1 |
 * | ADC0     | A0    | RX    | GPIO3 |
 * | GPIO16   | D0    | D1    | GPIO5 |
 * | GPIO14   | D5    | D2    | GPIO4 |
 * | GPIO12   | D6    | D3    | GPIO0 |
 * | GPIO13   | D7    | D4    | GPIO2 |
 * | GPIO15   | D8    | G     | GND   |
 * | 3.3V Out | 3V3   | 5V    | 5V In |
 * USB Port = Bottom
 */

// Default pins (previously "VERSION3")
#define DEFAULT_MOTOR_EN 15 //D8
#define DEFAULT_MOTOR_IN1 13 //D7
#define DEFAULT_MOTOR_IN2 12 //D6
#define DEFAULT_MOTOR_IN3 14 //D5
#define DEFAULT_MOTOR_IN4 16 //D0

// The LED strip is driven via the ESP8266's UART1 hardware (LightBar.h) rather than
// bit-banged, so its data pin is fixed to GPIO2/D4 (UART1 TX) and isn't configurable -
// don't assign GPIO2 to anything else above.
#define DEFAULT_LED_COUNT 8

// The DRV8833 thermally shuts off after ~45s at full throttle (as little as 10s if already
// warm) - regular driving is capped at a percentage of max PWM, with a timed "boost" button
// temporarily lifting the cap. Defaults: normal driving at 75% of max, boost at 100% (actual max).
#define DEFAULT_REGULAR_PWM_LIMIT_PERCENT 75
#define DEFAULT_BOOST_PWM_LIMIT_PERCENT 100

//Motor Settings (not runtime-configurable - tune per hardware and reflash)
#define MIN_PWM_L 30
#define MIN_PWM_R 30
#define MAX_PWM_L 255
#define MAX_PWM_R 255

// Boost window and mandatory cooldown before it can be used again (see PropulsionSystem).
#define BOOST_DURATION_MS 10000
#define BOOST_COOLDOWN_MS 30000

#define TRIM 0.0F

#define DEBUG

#endif
