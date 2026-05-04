#include <WiFi.h>
#include "DHTesp.h"

// ================= WIFI =================
const char* ssid = "";
const char* password = "";

// ================= PIN =================
const int ir1 = 18;
const int ir2 = 19;
const int pirPin = 2;

const int ledPin = 5;

// ================= DHT =================
DHTesp dht;
const int DHT_PIN = 17;

// ================= VARIABLE =================
int peopleCount = 0;
bool countChanged = false;

// IR state
int state = 0;
unsigned long stateTime = 0;
const unsigned long timeout = 3000;

// DHT timing
unsigned long lastRead = 0;

// debounce IR
unsigned long lastTriggerTime = 0;
const unsigned long debounceDelay = 300;

// ================= PIR ADVANCED =================
bool lastMotion = LOW;
int motionCount = 0;

unsigned long motionStart = 0;
float motionDuration = 0;

bool isMotionActive = false;

// ================= WIFI =================
void connectWiFi() {
  WiFi.begin(ssid, password);

  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  pinMode(ir1, INPUT);
  pinMode(ir2, INPUT);
  pinMode(pirPin, INPUT);

  pinMode(ledPin, OUTPUT);

  dht.setup(DHT_PIN, DHTesp::DHT11);

  // connectWiFi(); // aktifkan kalau mau online
}

// ================= LOOP =================
void loop() {

  // ===== BACA SENSOR =====
  bool outside = digitalRead(ir1) == LOW;
  bool inside  = digitalRead(ir2) == LOW;
  bool motion  = digitalRead(pirPin);

  // ===== PIR ADVANCED =====
  if (motion == HIGH && lastMotion == LOW) {
    Serial.println("🚶 Gerakan MULAI");

    motionCount++;
    motionStart = millis();
    isMotionActive = true;
  }

  if (motion == LOW && lastMotion == HIGH) {
    Serial.println("🛑 Gerakan BERHENTI");

    motionDuration = (millis() - motionStart) / 1000.0;

    Serial.print("Durasi Gerakan: ");
    Serial.print(motionDuration);
    Serial.println(" detik");

    Serial.println("===== DATA PIR =====");
    Serial.print("Total Gerakan: ");
    Serial.println(motionCount);
    Serial.print("Durasi Terakhir: ");
    Serial.print(motionDuration);
    Serial.println(" detik");
    Serial.println("====================");

    isMotionActive = false;
  }

  lastMotion = motion;

  // ===== STATE MACHINE IR =====
  if (millis() - lastTriggerTime > debounceDelay) {

    if (state == 0) {
      if (outside) {
        state = 1;
        stateTime = millis();
        lastTriggerTime = millis();
      } 
      else if (inside) {
        state = 2;
        stateTime = millis();
        lastTriggerTime = millis();
      }
    }

    else if (state == 1 && inside) {
      peopleCount++;
      countChanged = true;
      Serial.println("Orang MASUK");
      state = 0;
      lastTriggerTime = millis();
    }

    else if (state == 2 && outside) {
      if (peopleCount > 0) peopleCount--;
      countChanged = true;
      Serial.println("Orang KELUAR");
      state = 0;
      lastTriggerTime = millis();
    }
  }

  // ===== TIMEOUT RESET =====
  if (state != 0 && millis() - stateTime > timeout) {
    Serial.println("RESET STATE (TIMEOUT)");
    state = 0;
  }

  // ===== OUTPUT PEOPLE COUNT =====
  if (countChanged) {
    Serial.println("\n===== PEOPLE COUNT =====");
    Serial.print("Jumlah Orang: ");
    Serial.println(peopleCount);
    Serial.println("========================\n");

    countChanged = false;
  }

  // ===== BACA DHT =====
  if (millis() - lastRead > 5000) {

    TempAndHumidity data = dht.getTempAndHumidity();

    if (isnan(data.temperature) || isnan(data.humidity)) {
      Serial.println("Gagal baca DHT!");
    } else {
      Serial.println("\n===== DATA SENSOR =====");
      Serial.print("Suhu: ");
      Serial.print(data.temperature);
      Serial.println(" °C");

      Serial.print("Kelembaban: ");
      Serial.print(data.humidity);
      Serial.println(" %");
      Serial.println("======================\n");
    }

    lastRead = millis();
  }

  // ===== LED (RGB 2 PIN) =====
  if (peopleCount > 0) {
    digitalWrite(ledPin, HIGH); // nyala
  } else {
    digitalWrite(ledPin, LOW);  // mati
  }

  delay(50);
}