#include "Settings.h"
#include "Config.h"
#include <EEPROM.h>
#include <string.h>

Settings settings;

static void loadDefaults() {
  settings.magic = SETTINGS_MAGIC;
  settings.apMode = true;
  strncpy(settings.apSsid, DEFAULT_AP_SSID, SSID_MAX_LEN - 1);
  settings.apSsid[SSID_MAX_LEN - 1] = '\0';
  strncpy(settings.apPassword, DEFAULT_AP_PASSWORD, PASSWORD_MAX_LEN - 1);
  settings.apPassword[PASSWORD_MAX_LEN - 1] = '\0';
  strncpy(settings.staSsid, DEFAULT_STA_SSID, SSID_MAX_LEN - 1);
  settings.staSsid[SSID_MAX_LEN - 1] = '\0';
  strncpy(settings.staPassword, DEFAULT_STA_PASSWORD, PASSWORD_MAX_LEN - 1);
  settings.staPassword[PASSWORD_MAX_LEN - 1] = '\0';
  settings.motorEn = DEFAULT_MOTOR_EN;
  settings.motorIn1 = DEFAULT_MOTOR_IN1;
  settings.motorIn2 = DEFAULT_MOTOR_IN2;
  settings.motorIn3 = DEFAULT_MOTOR_IN3;
  settings.motorIn4 = DEFAULT_MOTOR_IN4;
  settings.ledCount = DEFAULT_LED_COUNT;
  settings.regularPwmLimitPercent = DEFAULT_REGULAR_PWM_LIMIT_PERCENT;
  settings.boostPwmLimitPercent = DEFAULT_BOOST_PWM_LIMIT_PERCENT;
}

void Settings_load() {
  EEPROM.begin(sizeof(Settings));
  EEPROM.get(0, settings);
  if (settings.magic != SETTINGS_MAGIC) {
    loadDefaults();
    Settings_save();
  }
}

void Settings_save() {
  settings.magic = SETTINGS_MAGIC;
  settings.apSsid[SSID_MAX_LEN - 1] = '\0';
  settings.apPassword[PASSWORD_MAX_LEN - 1] = '\0';
  settings.staSsid[SSID_MAX_LEN - 1] = '\0';
  settings.staPassword[PASSWORD_MAX_LEN - 1] = '\0';
  EEPROM.put(0, settings);
  EEPROM.commit();
}

void Settings_reset() {
  loadDefaults();
  Settings_save();
}
