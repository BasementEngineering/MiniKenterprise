#ifndef CONFIG_H
#define CONFIG_H

/*** WiFi Config ***/
// Set the Mini Kenterprise up in AP Mode to use it standalone without a WiFi network
#define AP_MODE

// Access Point Settings
#define APSSID "MiniKenterprise"
#define APPSK  "RowYourBoat"
#define MAX_WIFI_CONNECTIONS 2

//Station Settings
#define NETWORK_SSID "WiFi_Network"
#define NETWORK_PSK  "Network_Password*"


//Motor Settings
#define MIN_PWM_L 40
#define MIN_PWM_R 40
#define MAX_PWM_L 255
#define MAX_PWM_R 255

#define TRIM 0.0F

#define DEBUG

//#define RUDDER_STEERING

//#define VERSION1_PINS
#define VERSION3_PINS
//#define CUSTOM_PINS
//#define LEGOBOAT_PINS
/*** Your Pin Configuration ***/
/*** Version 1 ***/
#ifdef VERSION1_PINS
#define MOTOR_EN 15
#define MOTOR_IN1 13
#define MOTOR_IN2 0
#define MOTOR_IN3 14
#define MOTOR_IN4 12

#define LED_PIN 2
#define LED_COUNT 8
#endif

/*** Version 1 ***/
#ifdef LEGOBOAT_PINS
#define MOTOR_EN 12
#define MOTOR_IN1 15
#define MOTOR_IN2 13
#define MOTOR_IN3 16 //Rudder

#define LED_PIN 2
#define LED_COUNT 1
#endif

/*** Version 3 ***/
#ifdef VERSION3_PINS
#define MOTOR_EN 15 //D8
#define MOTOR_IN1 13 //D7
#define MOTOR_IN2 12 //D6
#define MOTOR_IN3 14 //D5
#define MOTOR_IN4 16 //D0

#define LED_PIN 2 //D4
#define LED_COUNT 5
#endif

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

 #endif
