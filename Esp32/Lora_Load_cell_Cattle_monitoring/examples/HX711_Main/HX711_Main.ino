/*
 * ESP32 Scale — Device Layer
 * Combines: Load Cell weighing + LoRa cow_id receiving (proximity-filtered) + WiFi backend send
 */

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>
#include "HX711.h"
#include "soc/rtc.h"
#include <Preferences.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

// ════════════════════════════════════════════════════════════
//  ⚠️ EDIT THESE EVERY TIME YOU CHANGE NETWORKS OR BACKEND ⚠️
// ════════════════════════════════════════════════════════════
const char*    WIFI_SSID     = "Char";
const char*    WIFI_PASSWORD = "11111111";
const char*    BACKEND_HOST  = "agroscale-backend.onrender.com";
const uint16_t BACKEND_PORT  = 443;                   // 443 for HTTPS (Render), 3002 for local HTTP
const bool     USE_HTTPS     = true;                  // true for https://agroscale-backend.onrender.com
const char*    DEVICE_ID     = "esp32-gateway-01";
const char*    IOT_API_KEY   = "your_iot_key";

// ── LoRa pins ────────────────────────────────────────────────
#define LORA_SS   5
#define LORA_RST  14
#define LORA_DIO0 2

// ── HX711 pins ───────────────────────────────────────────────
const int LOADCELL_DOUT_PIN = 21;
const int LOADCELL_SCK_PIN  = 22;

// ── Weighing settings ──────────────────────────────────────
const int   TARE_SAMPLES        = 30;
const int   READ_SAMPLES        = 10;
const int   CAL_SAMPLES         = 50;
const float ZERO_BAND_G         = 20.0f;
const float STABLE_THRESHOLD_G  = 50.0f;
const int   STABLE_COUNT        = 5;
const int   AVG_WINDOW          = 5;   // simple moving average window
const float DEFAULT_CAL_FACTOR  = 104.6927f;

// ── Proximity filter ───────────────────────────────────────
const int GATE_RSSI_THRESHOLD = -70;

// ── Cow ID / LoRa matching window ───────────────────────────
const unsigned long COW_ID_VALID_WINDOW_MS = 8000;
const unsigned long LORA_WAIT_MS           = 4000;

// ─────────────────────────────────────────────────────────────
HX711       scale;
Preferences prefs;
float calibrationFactor = DEFAULT_CAL_FACTOR;

// Simple moving average buffer
static float avgBuf[AVG_WINDOW] = {0};
static int   avgIdx   = 0;
static int   avgCount = 0;

String        lastCowID     = "";
unsigned long lastCowIDTime = 0;

enum GateState { IDLE, WAITING_FOR_LORA };
GateState     gateState        = IDLE;
unsigned long waitStartTime    = 0;
float         pendingWeight    = 0;
float         lastProcessedWeight = -9999;

// ────────────────────────────────────────────────────────────
void saveCalibration(float factor) {
  prefs.begin("loadcell", false);
  prefs.putFloat("cal_factor", factor);
  prefs.end();
  Serial.println("  [SAVED] factor = " + String(factor, 4));
}

float loadCalibration() {
  prefs.begin("loadcell", true);
  float saved = prefs.getFloat("cal_factor", DEFAULT_CAL_FACTOR);
  prefs.end();
  return saved;
}

void clearCalibration() {
  prefs.begin("loadcell", false);
  prefs.clear();
  prefs.end();
  calibrationFactor = DEFAULT_CAL_FACTOR;
  scale.set_scale(calibrationFactor);
  Serial.println("  [CLEARED] Reset to default: " + String(DEFAULT_CAL_FACTOR, 4));
}

void resetAverage() {
  avgCount = 0;
  avgIdx = 0;
}

// ────────────────────────────────────────────────────────────
//  Simple moving average — responds to real changes immediately,
//  no "stuck" state, easy to reason about
// ────────────────────────────────────────────────────────────
float applyMovingAverage(float sample) {
  avgBuf[avgIdx] = sample;
  avgIdx = (avgIdx + 1) % AVG_WINDOW;
  if (avgCount < AVG_WINDOW) avgCount++;

  float sum = 0;
  for (int i = 0; i < avgCount; i++) sum += avgBuf[i];
  return sum / avgCount;
}

// ────────────────────────────────────────────────────────────
void doCalibration() {
  Serial.println("\n>> CALIBRATION MODE");
  Serial.println("   Place known weight on scale.");
  Serial.print("   Type weight in grams and press Enter: ");
  while (!Serial.available()) { delay(100); }
  String input = Serial.readStringUntil('\n');
  input.trim();
  float knownWeight = input.toFloat();
  if (knownWeight <= 0) { Serial.println("   Cancelled."); return; }

  Serial.println("   Reading " + String(CAL_SAMPLES) + " samples, please wait...");
  scale.set_scale();
  double sum = 0;
  for (int i = 0; i < CAL_SAMPLES; i++) {
    sum += scale.get_units(1);
    delay(20);
    if (i % 10 == 9) Serial.print(".");
  }
  Serial.println();

  float rawAvg = (float)(sum / CAL_SAMPLES);
  float newFactor = rawAvg / knownWeight;
  scale.set_scale(newFactor);
  calibrationFactor = newFactor;
  saveCalibration(newFactor);
  resetAverage();

  Serial.println("\n   Calibration complete!");
  Serial.print(  "   Factor : "); Serial.println(newFactor, 4);
  Serial.println("   Saved to flash. No re-upload needed.\n");
}

// ────────────────────────────────────────────────────────────
void checkLoRaReceive() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String received = "";
    while (LoRa.available()) received += (char)LoRa.read();
    int rssi = LoRa.packetRssi();
    if (rssi > GATE_RSSI_THRESHOLD) {
      lastCowID     = received;
      lastCowIDTime = millis();
      Serial.println("[LoRa] cow_id=" + received + " RSSI=" + String(rssi) + "dBm  [NEAR GATE]");
    } else {
      Serial.println("[LoRa] cow_id=" + received + " RSSI=" + String(rssi) + "dBm  [too far, ignored]");
    }
  }
}

// ────────────────────────────────────────────────────────────
//  Sends connection heartbeat ping to backend (POST /api/v1/iot/heartbeat)
// ────────────────────────────────────────────────────────────
bool sendStartupHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Skipped Heartbeat: WiFi not connected");
    return false;
  }

  String path = "/api/v1/iot/heartbeat";
  String payload = "{\"device_id\":\"" + String(DEVICE_ID) + "\",\"battery\":100}";

  WiFiClient *clientPtr;
  WiFiClientSecure secureClient;
  WiFiClient plainClient;

  if (USE_HTTPS) {
    secureClient.setInsecure(); // Enables HTTPS/TLS without hardcoding expiring CA certs
    clientPtr = &secureClient;
  } else {
    clientPtr = &plainClient;
  }

  clientPtr->setTimeout(10000);

  Serial.println("[HTTP Heartbeat] POST " + String(USE_HTTPS ? "https://" : "http://") + String(BACKEND_HOST) + ":" + String(BACKEND_PORT) + path);
  Serial.println("[HTTP Heartbeat] Body: " + payload);

  if (!clientPtr->connect(BACKEND_HOST, BACKEND_PORT)) {
    Serial.println("[HTTP Heartbeat] Connect failed");
    return false;
  }

  clientPtr->print("POST " + path + " HTTP/1.1\r\n");
  clientPtr->print("Host: " + String(BACKEND_HOST) + "\r\n");
  clientPtr->print("Connection: close\r\n");
  clientPtr->print("Content-Type: application/json\r\n");
  clientPtr->print("x-api-key: " + String(IOT_API_KEY) + "\r\n");
  clientPtr->print("Content-Length: " + String(payload.length()) + "\r\n\r\n");
  clientPtr->print(payload);

  String response;
  unsigned long startMs = millis();
  while ((millis() - startMs) < 10000) {
    while (clientPtr->available()) response += (char)clientPtr->read();
    if (!clientPtr->connected()) break;
    delay(1);
  }
  clientPtr->stop();

  Serial.println("[HTTP Heartbeat] Response: " + response);

  int statusCode = -1;
  int firstLineEnd = response.indexOf('\n');
  if (firstLineEnd > 0) {
    int firstSpace = response.substring(0, firstLineEnd).indexOf(' ');
    if (firstSpace > 0) statusCode = response.substring(firstSpace + 1).toInt();
  }
  return statusCode >= 200 && statusCode < 400;
}

// ────────────────────────────────────────────────────────────
//  Sends weight measurement payload to backend (POST /api/v1/iot/measurements)
// ────────────────────────────────────────────────────────────
bool sendCowWeight(String cowID, float weightGrams) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Skipped: WiFi not connected");
    return false;
  }

  float weightKg = weightGrams / 1000.0f;

  String path = "/api/v1/iot/measurements";
  String payload = "{\"device_id\":\"" + String(DEVICE_ID) +
                   "\",\"cow_id\":\"" + cowID +
                   "\",\"weight_kg\":" + String(weightKg, 2) + "}";

  WiFiClient *clientPtr;
  WiFiClientSecure secureClient;
  WiFiClient plainClient;

  if (USE_HTTPS) {
    secureClient.setInsecure(); // Enables HTTPS/TLS without hardcoding expiring CA certs
    clientPtr = &secureClient;
  } else {
    clientPtr = &plainClient;
  }

  clientPtr->setTimeout(10000);

  Serial.println("[HTTP] POST " + String(USE_HTTPS ? "https://" : "http://") + String(BACKEND_HOST) + ":" + String(BACKEND_PORT) + path);
  Serial.println("[HTTP] Body: " + payload);

  if (!clientPtr->connect(BACKEND_HOST, BACKEND_PORT)) {
    Serial.println("[HTTP] Connect failed");
    return false;
  }

  clientPtr->print("POST " + path + " HTTP/1.1\r\n");
  clientPtr->print("Host: " + String(BACKEND_HOST) + "\r\n");
  clientPtr->print("Connection: close\r\n");
  clientPtr->print("Content-Type: application/json\r\n");
  clientPtr->print("x-api-key: " + String(IOT_API_KEY) + "\r\n");
  clientPtr->print("Content-Length: " + String(payload.length()) + "\r\n\r\n");
  clientPtr->print(payload);

  String response;
  unsigned long startMs = millis();
  while ((millis() - startMs) < 10000) {
    while (clientPtr->available()) response += (char)clientPtr->read();
    if (!clientPtr->connected()) break;
    delay(1);
  }
  clientPtr->stop();

  Serial.println("[HTTP] Response: " + response);

  int statusCode = -1;
  int firstLineEnd = response.indexOf('\n');
  if (firstLineEnd > 0) {
    int firstSpace = response.substring(0, firstLineEnd).indexOf(' ');
    if (firstSpace > 0) statusCode = response.substring(firstSpace + 1).toInt();
  }
  return statusCode >= 200 && statusCode < 400;
}

// ════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);

  rtc_cpu_freq_config_t config;
  rtc_clk_cpu_freq_get_config(&config);
  rtc_clk_cpu_freq_to_config(RTC_CPU_FREQ_80M, &config);
  rtc_clk_cpu_freq_set_config_fast(&config);

  Serial.println("=== ESP32 Scale — Device Layer ===");

  Serial.print("[WiFi] Connecting to "); Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 15000) {
    delay(500); Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] Connected. IP: " + WiFi.localIP().toString());
    sendStartupHeartbeat();
  } else {
    Serial.println("[WiFi] Failed to connect — check SSID/password/network — will keep retrying reads offline.");
  }

  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433E6)) {
    Serial.println("[LoRa] init failed!");
    while (true);
  }
  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(250E3);
  Serial.println("[LoRa] receiver ready");

  calibrationFactor = loadCalibration();
  Serial.print("Calibration factor loaded: "); Serial.println(calibrationFactor, 4);
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(calibrationFactor);

  Serial.print("Settling 5s...");
  delay(5000);
  scale.tare(TARE_SAMPLES);
  Serial.println(" tare done.");
  Serial.println();
  Serial.println("Commands: t=tare  r=raw  c=calibrate  x=clear  s=settings");
  Serial.println("========================================================");
}

// ════════════════════════════════════════════════════════════
void loop() {

  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.length() > 0) {
      char cmd = tolower(input.charAt(0));
      if (cmd == 't') {
        scale.tare(TARE_SAMPLES);
        resetAverage();
        Serial.println("Tare done.");
      } else if (cmd == 'r') {
        Serial.println("Raw: " + String(scale.get_value(READ_SAMPLES)));
      } else if (cmd == 'c') {
        doCalibration();
      } else if (cmd == 'x') {
        clearCalibration();
        resetAverage();
      } else if (cmd == 's') {
        Serial.println("\n  Factor: " + String(calibrationFactor, 4));
        Serial.println("  RSSI threshold: " + String(GATE_RSSI_THRESHOLD) + " dBm");
        Serial.println("  Backend: " + String(BACKEND_HOST) + ":" + String(BACKEND_PORT));
      }
    }
  }

  checkLoRaReceive();

  float raw_sample = scale.get_units(READ_SAMPLES);
  float display    = applyMovingAverage(raw_sample);

  if (fabsf(display) < ZERO_BAND_G) display = 0.0f;

  static float prev_display   = 0.0f;
  static int   stable_counter = 0;
  if (avgCount == AVG_WINDOW && fabsf(display - prev_display) <= STABLE_THRESHOLD_G) stable_counter++;
  else stable_counter = 0;
  bool is_stable = (avgCount == AVG_WINDOW) && (stable_counter >= STABLE_COUNT);
  prev_display = display;

  float displayKg = display / 1000.0f;

  Serial.print("Weight: "); Serial.print(displayKg, 2); Serial.print("kg");
  Serial.print("  ("); Serial.print(display, 1); Serial.print("g, raw: "); Serial.print(raw_sample, 1); Serial.print("g)");
  if (is_stable) Serial.print("  [STABLE]");
  Serial.println();

  bool isNewReading = is_stable && display > ZERO_BAND_G &&
                       fabsf(display - lastProcessedWeight) > 5.0f;

  switch (gateState) {
    case IDLE:
      if (isNewReading) {
        bool haveCowID = (lastCowID != "") &&
                         (millis() - lastCowIDTime <= COW_ID_VALID_WINDOW_MS);
        if (haveCowID) {
          Serial.println("[Consolidate] cow_id=" + lastCowID + " weight=" + String(displayKg, 2) + "kg");
          bool ok = sendCowWeight(lastCowID, display);
          Serial.println(ok ? "[HTTP] send ok" : "[HTTP] send failed");
          lastProcessedWeight = display;
        } else {
          Serial.println("[Wait] No cow_id yet, waiting up to " + String(LORA_WAIT_MS/1000) + "s...");
          gateState     = WAITING_FOR_LORA;
          waitStartTime = millis();
          pendingWeight = display;
        }
      }
      break;

    case WAITING_FOR_LORA: {
      bool receivedDuringWait = (lastCowID != "") && (lastCowIDTime >= waitStartTime);
      if (receivedDuringWait) {
        float pendingKg = pendingWeight / 1000.0f;
        Serial.println("[Consolidate] cow_id=" + lastCowID + " weight=" + String(pendingKg, 2) + "kg");
        bool ok = sendCowWeight(lastCowID, pendingWeight);
        Serial.println(ok ? "[HTTP] send ok" : "[HTTP] send failed");
        lastProcessedWeight = pendingWeight;
        gateState = IDLE;
      } else if (millis() - waitStartTime > LORA_WAIT_MS) {
        Serial.println("[Discard] No cow_id received in time. Reading discarded.");
        lastProcessedWeight = pendingWeight;
        gateState = IDLE;
      }
      break;
    }
  }

  delay(300);
}