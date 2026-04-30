#include <WiFi.h>
#include "DHTesp.h"

// ================= WIFI (OPTIONAL) =================
// boleh dihapus kalau mau full offline
const char* ssid = "KEDAI RAMAH JIWA 5G";
const char* password = "rojaliohrojali";

// ================= PIN =================
const int ir1 = 18;
const int ir2 = 19;
const int pirPin = 32;

const int ledRed = 25;
const int ledGreen = 26;

// ================= DHT11 =================
DHTesp dht;
const int DHT_PIN = 17;

// ================= VARIABLE =================
int peopleCount = 0;

int state = 0;
unsigned long stateTime = 0;
const unsigned long timeout = 3000;

unsigned long lastRead = 0;

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

  pinMode(ledRed, OUTPUT);
  pinMode(ledGreen, OUTPUT);

  dht.setup(DHT_PIN, DHTesp::DHT11);

  // 🔥 OPTIONAL (boleh dimatiin dulu)
  // connectWiFi();
}

// ================= LOOP =================
void loop() {

  bool outside = digitalRead(ir1) == LOW;
  bool inside  = digitalRead(ir2) == LOW;

  // ===== STATE MACHINE =====
  if (state == 0) {
    if (outside) {
      state = 1;
      stateTime = millis();
      Serial.println("Trigger LUAR");
    } 
    else if (inside) {
      state = 2;
      stateTime = millis();
      Serial.println("Trigger DALAM");
    }
  }

  else if (state == 1 && inside) {
    peopleCount++;
    Serial.println("✅ Orang MASUK");
    state = 0;
  }

  else if (state == 2 && outside) {
    if (peopleCount > 0) peopleCount--;
    Serial.println("⬅️ Orang KELUAR");
    state = 0;
  }

  // timeout reset
  if (state != 0 && millis() - stateTime > timeout) {
    Serial.println("⚠️ Reset state");
    state = 0;
  }

  // ===== BACA SENSOR TIAP 5 DETIK =====
  if (millis() - lastRead > 5000) {

    TempAndHumidity data = dht.getTempAndHumidity();

    Serial.println("\n===== DATA SENSOR =====");
    Serial.print("Jumlah Orang: ");
    Serial.println(peopleCount);

    Serial.print("Suhu: ");
    Serial.print(data.temperature);
    Serial.println(" °C");

    Serial.print("Kelembaban: ");
    Serial.print(data.humidity);
    Serial.println(" %");
    Serial.println("======================\n");

    lastRead = millis();
  }

  // ===== LED =====
  if (peopleCount > 0) {
    digitalWrite(ledRed, HIGH);
    digitalWrite(ledGreen, LOW);
  } else {
    digitalWrite(ledRed, LOW);
    digitalWrite(ledGreen, HIGH);
  }

  delay(100);
}