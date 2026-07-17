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

// Default pins (previously "VERSION1")
#define DEFAULT_MOTOR_EN 15
#define DEFAULT_MOTOR_IN1 13
#define DEFAULT_MOTOR_IN2 0
#define DEFAULT_MOTOR_IN3 14
#define DEFAULT_MOTOR_IN4 12

#define DEFAULT_LED_PIN 2
#define DEFAULT_LED_COUNT 8

//Motor Settings (not runtime-configurable - tune per hardware and reflash)
#define MIN_PWM_L 30
#define MIN_PWM_R 30
#define MAX_PWM_L 255
#define MAX_PWM_R 255

#define TRIM 0.0F

#define DEBUG

#endif
