#ifndef SETTINGS_H
#define SETTINGS_H

#include <Arduino.h>

#define SETTINGS_MAGIC 0x4B35 // bump when the struct layout below changes
#define SSID_MAX_LEN 32
#define PASSWORD_MAX_LEN 64

struct Settings {
  uint16_t magic;
  bool apMode; // true = boat hosts its own AP, false = joins staSsid as a station
  char apSsid[SSID_MAX_LEN];
  char apPassword[PASSWORD_MAX_LEN];
  char staSsid[SSID_MAX_LEN];
  char staPassword[PASSWORD_MAX_LEN];
  uint8_t motorEn;
  uint8_t motorIn1;
  uint8_t motorIn2;
  uint8_t motorIn3;
  uint8_t motorIn4;
  uint8_t ledCount;

  // PWM limiting (DRV8833 overheat protection - see PropulsionSystem::getCurrentPwmLimitBand()).
  // Default (true) looks the limit up from the battery's no-load voltage via Config.h's
  // pwmLimitBands - turning this off falls back to the two fixed manual percentages instead.
  bool voltageBasedPwmLimitEnabled;
  uint8_t manualRegularPwmLimitPercent;
  uint8_t manualBoostPwmLimitPercent;
};

extern Settings settings;

// Loads Settings from EEPROM. Falls back to Config.h defaults (and persists
// them) if the stored magic value doesn't match, e.g. on first boot.
void Settings_load();
void Settings_save();
void Settings_reset();

#endif
