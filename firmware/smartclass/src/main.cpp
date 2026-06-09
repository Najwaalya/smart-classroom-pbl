#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHTesp.h>
#include <PubSubClient.h>
#include <time.h>
#include "mbedtls/md.h"
#include "mbedtls/base64.h"

// =====================================================
// PIN DEFINITIONS
// =====================================================
#define IR1_PIN      18
#define IR2_PIN      19
#define PIR_PIN       2
#define RED_PIN       5
#define GREEN_PIN     4
#define DHT_PIN      17

// =====================================================
// WIFI CONFIGURATION
// =====================================================
const char* WIFI_SSID = "JTI-POLINEMA-2G";
const char* WIFI_PASSWORD = "jtifast!";

// =====================================================
// AZURE IOT HUB CONFIGURATION
// =====================================================
const char* MQTT_BROKER = "iothub-smart-classroom.azure-devices.net";
const int MQTT_PORT = 8883;

const char* DEVICE_ID = "esp32-smartclass-ti3b";

// =====================================================
// DEVICE PRIMARY KEY
// Ambil dari Azure Portal -> IoT Hub -> Devices -> Primary key
// Jangan bagikan key ini ke orang lain.
// =====================================================
const char* DEVICE_KEY = "OjvC1TTYndLC49k+3AUv6NptBvVMn9rvL+cgAxegUUY=";

// Token berlaku 1 jam
const long TOKEN_VALID_SECONDS = 3600;

// Token diperbarui 10 menit sebelum expired
const long TOKEN_REFRESH_BEFORE = 600;

String sasToken = "";
time_t tokenExpiryTime = 0;

// =====================================================
// MQTT CLIENT
// =====================================================
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// =====================================================
// DHT SENSOR
// =====================================================
DHTesp dht;

// =====================================================
// SENSOR DATA
// =====================================================
float temperature = 0.0;
float humidity = 0.0;

int peopleCount = 0;

bool motionDetected = false;

// =====================================================
// PIR VARIABLES
// =====================================================
bool lastMotion = LOW;

unsigned long motionStart = 0;
unsigned long lastMotionTime = 0;

const unsigned long motionCooldown = 3000;
unsigned long lastPirPrint = 0;
const unsigned long pirPrintInterval = 3000; // 3 detik

// =====================================================
// PEOPLE COUNT VARIABLES
// =====================================================
int state = 0;

unsigned long stateTime = 0;
const unsigned long timeout = 3000;

unsigned long lastTriggerTime = 0;
const unsigned long debounceDelay = 300;

// =====================================================
// TIMING
// =====================================================
unsigned long lastSend = 0;
const unsigned long sendInterval = 5000;

unsigned long lastMqttReconnect = 0;
const unsigned long mqttReconnectInterval = 5000;

// =====================================================
// FUNCTION DECLARATIONS
// =====================================================
void initializePins();
void connectWiFi();
void setupTime();
void connectMqtt();
void reconnectMqtt();
void mqttCallback(char* topic, byte* payload, unsigned int length);

String urlEncode(const String& value);
String createHmacSha256Signature(const String& stringToSign, const char* deviceKey);
String generateSasToken();
void refreshSasTokenIfNeeded();

void readDHT();
void updateLED();
void sendTelemetry();

// =====================================================
// INITIALIZE PINS
// =====================================================
void initializePins() {

  pinMode(IR1_PIN, INPUT);
  pinMode(IR2_PIN, INPUT);
  pinMode(PIR_PIN, INPUT);

  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);

  digitalWrite(RED_PIN, LOW);
  digitalWrite(GREEN_PIN, HIGH);

  dht.setup(DHT_PIN, DHTesp::DHT11);
}

// =====================================================
// SETUP TIME WITH NTP
// =====================================================
void setupTime() {
  Serial.println("[Time] Syncing time with NTP...");

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  time_t now = time(nullptr);
  int attempts = 0;

  while (now < 1000000000 && attempts < 40) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    attempts++;
  }

  Serial.println();

  if (now < 1000000000) {
    Serial.println("[Time] Failed to sync time. Restarting...");
    delay(3000);
    ESP.restart();
  }

  Serial.print("[Time] Unix time: ");
  Serial.println((long)now);
}

// =====================================================
// CONNECT WIFI
// =====================================================
void connectWiFi() {

  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED && attempts < 40) {

    delay(500);
    Serial.print(".");

    attempts++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("[WiFi] Connected!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());

  } else {

    Serial.println("[WiFi] Failed. Restarting...");
    delay(3000);

    ESP.restart();
  }
}

// =====================================================
// URL ENCODE
// =====================================================
String urlEncode(const String& value) {
  String encoded = "";
  char c;
  char code0;
  char code1;

  for (int i = 0; i < value.length(); i++) {
    c = value.charAt(i);

    if (
      isalnum(c) ||
      c == '-' ||
      c == '_' ||
      c == '.' ||
      c == '~'
    ) {
      encoded += c;
    } else {
      code1 = (c & 0xF) + '0';

      if ((c & 0xF) > 9) {
        code1 = (c & 0xF) - 10 + 'A';
      }

      c = (c >> 4) & 0xF;
      code0 = c + '0';

      if (c > 9) {
        code0 = c - 10 + 'A';
      }

      encoded += '%';
      encoded += code0;
      encoded += code1;
    }
  }

  return encoded;
}

// =====================================================
// CREATE HMAC SHA256 SIGNATURE
// =====================================================
String createHmacSha256Signature(const String& stringToSign, const char* deviceKey) {
  unsigned char decodedKey[64];
  size_t decodedKeyLength = 0;

  int decodeResult = mbedtls_base64_decode(
    decodedKey,
    sizeof(decodedKey),
    &decodedKeyLength,
    (const unsigned char*)deviceKey,
    strlen(deviceKey)
  );

  if (decodeResult != 0) {
    Serial.println("[SAS] Failed to decode device key");
    return "";
  }

  unsigned char hmacResult[32];

  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);

  const mbedtls_md_info_t* info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);

  mbedtls_md_setup(&ctx, info, 1);
  mbedtls_md_hmac_starts(&ctx, decodedKey, decodedKeyLength);
  mbedtls_md_hmac_update(
    &ctx,
    (const unsigned char*)stringToSign.c_str(),
    stringToSign.length()
  );
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  unsigned char base64Signature[128];
  size_t base64Length = 0;

  int encodeResult = mbedtls_base64_encode(
    base64Signature,
    sizeof(base64Signature),
    &base64Length,
    hmacResult,
    sizeof(hmacResult)
  );

  if (encodeResult != 0) {
    Serial.println("[SAS] Failed to encode signature");
    return "";
  }

  base64Signature[base64Length] = '\0';

  return String((char*)base64Signature);
}

// =====================================================
// GENERATE SAS TOKEN
// =====================================================
String generateSasToken() {
  time_t now = time(nullptr);

  tokenExpiryTime = now + TOKEN_VALID_SECONDS;

  String resourceUri =
    String(MQTT_BROKER) +
    "/devices/" +
    String(DEVICE_ID);

  String encodedResourceUri = urlEncode(resourceUri);

  String stringToSign =
    encodedResourceUri +
    "\n" +
    String((long)tokenExpiryTime);

  String signature = createHmacSha256Signature(stringToSign, DEVICE_KEY);

  if (signature == "") {
    Serial.println("[SAS] Signature generation failed");
    return "";
  }

  String token =
    "SharedAccessSignature sr=" +
    encodedResourceUri +
    "&sig=" +
    urlEncode(signature) +
    "&se=" +
    String((long)tokenExpiryTime);

  Serial.println("[SAS] New token generated");
  Serial.print("[SAS] Expired at Unix time: ");
  Serial.println((long)tokenExpiryTime);

  return token;
}

// =====================================================
// REFRESH SAS TOKEN IF NEEDED
// =====================================================
void refreshSasTokenIfNeeded() {
  time_t now = time(nullptr);

  if (sasToken == "" || now >= tokenExpiryTime - TOKEN_REFRESH_BEFORE) {
    Serial.println("[SAS] Token empty or almost expired. Refreshing...");

    sasToken = generateSasToken();

    if (sasToken == "") {
      Serial.println("[SAS] Failed to refresh token");
      return;
    }

    if (mqttClient.connected()) {
      Serial.println("[MQTT] Disconnecting to use new SAS token...");
      mqttClient.disconnect();
    }
  }
}

// =====================================================
// MQTT CALLBACK
// =====================================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {

  Serial.print("[MQTT] Message received on topic: ");
  Serial.println(topic);

  Serial.print("[MQTT] Payload: ");

  for (unsigned int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }

  Serial.println();
}

// =====================================================
// CONNECT AZURE IOT HUB
// =====================================================
void connectMqtt() {

  Serial.println();
  Serial.println("[Azure] Connecting to Azure IoT Hub...");

  espClient.setInsecure();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(1024);

  // Username Azure
  String username =
    String(MQTT_BROKER) +
    "/" +
    String(DEVICE_ID) +
    "/?api-version=2021-04-12";

  // Client ID HARUS sama dengan Device ID
  String clientId = String(DEVICE_ID);

  refreshSasTokenIfNeeded();

  Serial.print("[Azure] Device ID : ");
  Serial.println(DEVICE_ID);

  Serial.println("[Azure] Connecting MQTT...");

  bool connected = mqttClient.connect(
    clientId.c_str(),
    username.c_str(),
    sasToken.c_str()
  );

  if (connected) {

    Serial.println("[Azure] Connected!");

    String subscribeTopic =
      "devices/" +
      String(DEVICE_ID) +
      "/messages/devicebound/#";

    mqttClient.subscribe(subscribeTopic.c_str());

    Serial.print("[Azure] Subscribed: ");
    Serial.println(subscribeTopic);

  } else {

    Serial.print("[Azure] MQTT Failed. State: ");
    Serial.println(mqttClient.state());
  }
}

// =====================================================
// MQTT RECONNECT
// =====================================================
void reconnectMqtt() {

  if (!mqttClient.connected()) {

    unsigned long now = millis();

    if (now - lastMqttReconnect >= mqttReconnectInterval) {

      lastMqttReconnect = now;

      connectMqtt();
    }
  }
}

// =====================================================
// READ DHT
// =====================================================
void readDHT() {

  TempAndHumidity data = dht.getTempAndHumidity();

  if (!isnan(data.temperature) && !isnan(data.humidity)) {

    temperature = data.temperature;
    humidity = data.humidity;

  } else {

    Serial.println("[DHT] Failed reading sensor");
  }
}

// =====================================================
// UPDATE LED
// =====================================================
void updateLED() {

  if (peopleCount > 0) {

    digitalWrite(RED_PIN, HIGH);
    digitalWrite(GREEN_PIN, LOW);

  } else {

    digitalWrite(RED_PIN, LOW);
    digitalWrite(GREEN_PIN, HIGH);
  }
}

// =====================================================
// SEND TELEMETRY
// =====================================================
void sendTelemetry() {

  if (!mqttClient.connected()) {

    Serial.println("[Telemetry] MQTT disconnected");
    return;
  }

  // =========================================
  // ROOM STATUS
  // =========================================
  String roomStatus = "EMPTY";

  if (peopleCount > 0) {
    roomStatus = "ACTIVE";
  }

  // =========================================
  // CREATE JSON
  // =========================================
  JsonDocument doc;

  doc["deviceId"] = DEVICE_ID;
  doc["roomId"] = "RT5-5T";

  doc["temperature"] = temperature;
  doc["humidity"] = humidity;

  doc["peopleCount"] = peopleCount;

  doc["motionDetected"] = digitalRead(PIR_PIN);

  doc["roomStatus"] = roomStatus;

  doc["ledStatus"] =
    (peopleCount > 0)
    ? "RED"
  : "GREEN";

  // =========================================
  // SERIALIZE JSON
  // =========================================
  char payload[512];

  serializeJson(doc, payload, sizeof(payload));

  // =========================================
  // VERY IMPORTANT
  // SEND AS JSON TO AZURE
  // =========================================
  String topic =
    "devices/" +
    String(DEVICE_ID) +
    "/messages/events/$.ct=application%2Fjson&$.ce=utf-8";

  Serial.println();
  Serial.println("[Telemetry] Sending JSON:");
  Serial.println(payload);

  bool published =
    mqttClient.publish(
      topic.c_str(),
      payload
    );

  if (published) {

    Serial.println("[Telemetry] SUCCESS");

  } else {

    Serial.println("[Telemetry] FAILED");
  }
}

// =====================================================
// SETUP
// =====================================================
void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("=================================");
  Serial.println(" SMART CLASSROOM MONITORING");
  Serial.println(" ESP32 -> AZURE IOT HUB");
  Serial.println("=================================");

  initializePins();

  Serial.println("[System] Pins initialized");

  connectWiFi();
  setupTime();
  connectMqtt();

  Serial.println("[System] Setup complete");
}

// =====================================================
// MAIN LOOP
// =====================================================
void loop() {

  // =========================================
  // WIFI CHECK
  // =========================================
  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("[WiFi] Reconnecting...");
    connectWiFi();
  }

  // =========================================
  // MQTT CHECK
  // =========================================
  refreshSasTokenIfNeeded();

  if (!mqttClient.connected()) {

    reconnectMqtt();

  } else {

    mqttClient.loop();
  }

  // =========================================
  // SENSOR READ
  // =========================================
  bool outside = (digitalRead(IR1_PIN) == LOW);
  bool inside  = (digitalRead(IR2_PIN) == LOW);

  // =========================================
  // PIR MOTION DETECTION
  // =========================================
  bool pirRaw = (digitalRead(PIR_PIN) == HIGH);
  unsigned long nowMs = millis();

  if (pirRaw && (nowMs - lastMotionTime >= motionCooldown)) {
    motionDetected = true;
    lastMotionTime = nowMs;
  } else if (!pirRaw && motionDetected && (nowMs - lastMotionTime >= motionCooldown)) {
    motionDetected = false;
  }

  // Print status PIR setiap 3 detik
  if (nowMs - lastPirPrint >= pirPrintInterval) {
    lastPirPrint = nowMs;
    if (motionDetected) {
      Serial.println("[PIR] Motion detected");
    } else {
      Serial.println("[PIR] No motion");
    }
  }

  // =========================================
  // PEOPLE COUNT
  // =========================================
  if (millis() - lastTriggerTime > debounceDelay) {

    // WAITING
    if (state == 0) {

      if (outside) {

        state = 1;
        stateTime = millis();

        lastTriggerTime = millis();

        Serial.println("[IR] IR1 first");
      }

      else if (inside) {

        state = 2;
        stateTime = millis();

        lastTriggerTime = millis();

        Serial.println("[IR] IR2 first");
      }
    }

    // MASUK
    else if (state == 1 && inside) {

      peopleCount++;

      Serial.println("[People] ENTER");

      Serial.print("[People] Total: ");
      Serial.println(peopleCount);

      state = 0;

      lastTriggerTime = millis();
    }

    // KELUAR
    else if (state == 2 && outside) {

      if (peopleCount > 0) {
        peopleCount--;
      }

      Serial.println("[People] EXIT");

      Serial.print("[People] Total: ");
      Serial.println(peopleCount);

      state = 0;

      lastTriggerTime = millis();
    }
  }

  // =========================================
  // TIMEOUT RESET
  // =========================================
  if (
    state != 0 &&
    millis() - stateTime > timeout
  ) {

    Serial.println("[IR] Timeout reset");

    state = 0;
  }

  // =========================================
  // UPDATE LED
  // =========================================
  updateLED();

  // =========================================
  // SEND DATA EVERY 5 SECONDS
  // =========================================
  if (millis() - lastSend >= sendInterval) {
    lastSend = millis();

    readDHT();

    Serial.println();
    Serial.println("=================================");
    Serial.println(" SMART CLASS STATUS");
    Serial.println("=================================");

    Serial.print("People Count : ");
    Serial.println(peopleCount);

    Serial.print("Motion Status : ");

    if (motionDetected) {
      Serial.println("DETECTED");
    } else {
      Serial.println("NO MOTION");
    }

    Serial.print("Temperature : ");
    Serial.print(temperature);
    Serial.println(" C");

    Serial.print("Humidity : ");
    Serial.print(humidity);
    Serial.println(" %");

    Serial.print("Room Status : ");

    if (peopleCount > 0) {
      Serial.println("ACTIVE");
    } else {
      Serial.println("EMPTY");
    }

    Serial.println("=================================");

    sendTelemetry();
  }

  delay(50);
}