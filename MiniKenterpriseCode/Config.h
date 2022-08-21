/*** Your WiFi Credentials ***/
#define APSSID "MiniKenterprise_X"
#define APPSK  "RowYourBoat"
#define MAX_WIFI_CONNECTIONS 1
#define AP_MODE

#define DEBUG

/*** Your Pin Configuration ***/
/*** Version 1 ***/
/*#define MOTOR_EN 15
#define MOTOR_IN1 13
#define MOTOR_IN2 0
#define MOTOR_IN3 14
#define MOTOR_IN4 12

#define LED_PIN 2
#define LED_COUNT 8*/

/*** Version 3 ***/
#define MOTOR_EN 15 //D8
#define MOTOR_IN1 13 //D7
#define MOTOR_IN2 12 //D6
#define MOTOR_IN3 14 //D5
#define MOTOR_IN4 16 //D0

#define LED_PIN 2 //D4
#define LED_COUNT 8

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
