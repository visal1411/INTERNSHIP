#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

namespace BackendApi {

struct Config {
  String baseUrl;  // e.g. "https://agroscale-backend.onrender.com" or "http://192.168.0.242:3002"
  String deviceId;
  String apiKey;
  unsigned long timeoutMs = 10000;
  bool useInsecureTls = true; // Use TLS without hardcoding expiring CA certs
};

inline bool connectWiFi(const char *ssid,
                        const char *password,
                        unsigned long timeoutMs = 15000) {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long startMs = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startMs) < timeoutMs) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WiFi] Connected. IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    return true;
  }

  Serial.print("[WiFi] Failed. Status=");
  Serial.println((int)WiFi.status());
  return false;
}

inline bool postHeartbeat(const Config &config, int battery = 100, String *responseBody = nullptr) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Skipped Heartbeat: WiFi not connected");
    return false;
  }

  String payload = "{\"device_id\":\"" + config.deviceId + "\",\"battery\":" + String(battery) + "}";

  bool isHttps = config.baseUrl.startsWith("https://");
  String url = config.baseUrl;
  if (url.startsWith("http://")) url = url.substring(7);
  else if (url.startsWith("https://")) url = url.substring(8);

  String host;
  String path = "/api/v1/iot/heartbeat";
  uint16_t port = isHttps ? 443 : 3002;

  int slashIndex = url.indexOf('/');
  if (slashIndex >= 0) {
    host = url.substring(0, slashIndex);
  } else {
    host = url;
  }

  int portIndex = host.indexOf(':');
  if (portIndex >= 0) {
    port = (uint16_t)host.substring(portIndex + 1).toInt();
    host = host.substring(0, portIndex);
  }

  WiFiClient *clientPtr;
  WiFiClientSecure secureClient;
  WiFiClient plainClient;

  if (isHttps) {
    if (config.useInsecureTls) {
      secureClient.setInsecure();
    }
    clientPtr = &secureClient;
  } else {
    clientPtr = &plainClient;
  }

  clientPtr->setTimeout(config.timeoutMs / 1000);

  Serial.print("[HTTP Heartbeat] POST ");
  Serial.print(isHttps ? "https://" : "http://");
  Serial.print(host);
  Serial.print(":");
  Serial.print(port);
  Serial.println(path);

  if (!clientPtr->connect(host.c_str(), port)) {
    Serial.println("[HTTP Heartbeat] Connect failed");
    return false;
  }

  clientPtr->print(String("POST ") + path + " HTTP/1.1\r\n");
  clientPtr->print(String("Host: ") + host + "\r\n");
  clientPtr->print("Connection: close\r\n");
  clientPtr->print("Content-Type: application/json\r\n");
  if (config.apiKey.length() > 0) {
    clientPtr->print(String("x-api-key: ") + config.apiKey + "\r\n");
  }
  clientPtr->print(String("Content-Length: ") + payload.length() + "\r\n\r\n");
  clientPtr->print(payload);

  String response;
  unsigned long startMs = millis();
  while ((millis() - startMs) < config.timeoutMs) {
    while (clientPtr->available()) {
      char c = (char)clientPtr->read();
      response += c;
    }
    if (!clientPtr->connected()) break;
    delay(1);
  }
  clientPtr->stop();

  int statusCode = -1;
  int firstLineEnd = response.indexOf('\n');
  if (firstLineEnd > 0) {
    String statusLine = response.substring(0, firstLineEnd);
    int firstSpace = statusLine.indexOf(' ');
    if (firstSpace > 0) statusCode = statusLine.substring(firstSpace + 1).toInt();
  }

  if (responseBody != nullptr) *responseBody = response;
  Serial.print("[HTTP Heartbeat] Status code: ");
  Serial.println(statusCode);

  return statusCode >= 200 && statusCode < 400;
}

inline bool postMeasurement(const Config &config, const String &cowId, float weightKg, String *responseBody = nullptr) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Skipped: WiFi not connected");
    return false;
  }

  String payload = "{\"device_id\":\"" + config.deviceId +
                   "\",\"cow_id\":\"" + cowId +
                   "\",\"weight_kg\":" + String(weightKg, 2) + "}";

  bool isHttps = config.baseUrl.startsWith("https://");
  String url = config.baseUrl;
  if (url.startsWith("http://")) url = url.substring(7);
  else if (url.startsWith("https://")) url = url.substring(8);

  String host;
  String path = "/api/v1/iot/measurements";
  uint16_t port = isHttps ? 443 : 3002;

  int slashIndex = url.indexOf('/');
  if (slashIndex >= 0) {
    host = url.substring(0, slashIndex);
  } else {
    host = url;
  }

  int portIndex = host.indexOf(':');
  if (portIndex >= 0) {
    port = (uint16_t)host.substring(portIndex + 1).toInt();
    host = host.substring(0, portIndex);
  }

  WiFiClient *clientPtr;
  WiFiClientSecure secureClient;
  WiFiClient plainClient;

  if (isHttps) {
    if (config.useInsecureTls) {
      secureClient.setInsecure();
    }
    clientPtr = &secureClient;
  } else {
    clientPtr = &plainClient;
  }

  clientPtr->setTimeout(config.timeoutMs / 1000);

  Serial.print("[HTTP] POST ");
  Serial.print(isHttps ? "https://" : "http://");
  Serial.print(host);
  Serial.print(":");
  Serial.print(port);
  Serial.println(path);

  if (!clientPtr->connect(host.c_str(), port)) {
    Serial.println("[HTTP] Connect failed");
    return false;
  }

  clientPtr->print(String("POST ") + path + " HTTP/1.1\r\n");
  clientPtr->print(String("Host: ") + host + "\r\n");
  clientPtr->print("Connection: close\r\n");
  clientPtr->print("Content-Type: application/json\r\n");
  if (config.apiKey.length() > 0) {
    clientPtr->print(String("x-api-key: ") + config.apiKey + "\r\n");
  }
  clientPtr->print(String("Content-Length: ") + payload.length() + "\r\n\r\n");
  clientPtr->print(payload);

  String response;
  unsigned long startMs = millis();
  while ((millis() - startMs) < config.timeoutMs) {
    while (clientPtr->available()) {
      char c = (char)clientPtr->read();
      response += c;
    }
    if (!clientPtr->connected()) break;
    delay(1);
  }
  clientPtr->stop();

  int statusCode = -1;
  int firstLineEnd = response.indexOf('\n');
  if (firstLineEnd > 0) {
    String statusLine = response.substring(0, firstLineEnd);
    int firstSpace = statusLine.indexOf(' ');
    if (firstSpace > 0) statusCode = statusLine.substring(firstSpace + 1).toInt();
  }

  if (responseBody != nullptr) *responseBody = response;
  Serial.print("[HTTP] Status code: ");
  Serial.println(statusCode);

  return statusCode >= 200 && statusCode < 400;
}

}  // namespace BackendApi