# SETUP GUIDE: Azure IoT Hub MQTT Connection

## Langkah 1: Generate SAS Token

### Menggunakan Azure CLI (Recommended):
```bash
az iot hub generate-sas-token \
  --hub-name iothub-smart-classroom \
  --device-id esp32-smartclass-ti3b \
  --duration 365
```

Atau jika durasi tidak perlu ditetapkan:
```bash
az iot hub generate-sas-token \
  --hub-name iothub-smart-classroom \
  --device-id esp32-smartclass-ti3b
```

**Output akan terlihat seperti:**
```
SharedAccessSignature sr=iothub-smart-classroom.azure-devices.net/devices/esp32-smartclass-ti3b&sig=xxxxxxxxxxxxxxxxxxxxx&se=1736999999&skn=owner
```

### Alternatif: Menggunakan Azure IoT Explorer
1. Buka Azure IoT Explorer
2. Connect ke IoT Hub Anda
3. Pilih Device: `esp32-smartclass-ti3b`
4. Di tab "Generate SAS Token", set expiry (ex: 365 hari)
5. Klik "Generate"
6. Copy token yang ditampilkan

---

## Langkah 2: Update Code di main.cpp

### Buka file: `firmware/smartclass/src/main.cpp`

### Update 3 bagian berikut:

#### A. WIFI CREDENTIALS (baris 19-20)
```cpp
const char* WIFI_SSID = "JTI-POLINEMA-2G";        // ← Update sesuai WiFi Anda
const char* WIFI_PASSWORD = "jtifast!";           // ← Update sesuai WiFi Anda
```

#### B. SAS TOKEN (baris 36)
```cpp
const char* SAS_TOKEN = "SharedAccessSignature sr=iothub-smart-classroom.azure-devices.net/devices/esp32-smartclass-ti3b&sig=YOUR_GENERATED_SIGNATURE_HERE&se=2099999999&skn=owner";
```

**GANTI** `YOUR_GENERATED_SIGNATURE_HERE` dengan hasil generate dari Azure CLI.

**Contoh yang benar:**
```cpp
const char* SAS_TOKEN = "SharedAccessSignature sr=iothub-smart-classroom.azure-devices.net/devices/esp32-smartclass-ti3b&sig=abc123def456xyz789&se=1736999999&skn=owner";
```

---

## Langkah 3: Upload ke ESP32

### Menggunakan PlatformIO:

#### Build & Upload:
```bash
cd firmware/smartclass
pio run --target upload
```

#### Monitor Serial Output:
```bash
pio run --target monitor
```

Atau gunakan VS Code → Click "Upload" button

---

## Langkah 4: Verifikasi Koneksi

### Expected Serial Output (sukses):
```
========================================
     SMARTCLASS MONITORING SYSTEM
========================================
[System] Pins initialized
Connecting to WiFi: JTI-POLINEMA-2G
[WiFi] Connected!
IP Address: 192.168.1.xxx
[WiFi] Waiting for NTP time sync...

[Azure] Connecting to Azure IoT Hub...
[Azure] Device ID: esp32-smartclass-ti3b
[Azure] Attempting MQTT connection...
[Azure] Connected to Azure IoT Hub!
[Azure] Subscribed to: devices/esp32-smartclass-ti3b/messages/devicebound/#
[System] Setup complete!

========================================
     SMARTCLASS MONITORING SYSTEM
========================================
People Count     : 0
Motion Count     : 0
Motion Duration  : 0.00 sec
Room Status      : EMPTY
Temperature      : 25.5 °C
Humidity         : 60.2 %
LED Status       : GREEN
MQTT Status      : Connected
========================================
[Telemetry] Sending:
{"temperature":25.5,"humidity":60.2,"peopleCount":0,"motionCount":0,"motionDuration":0,"roomStatus":"EMPTY","ledStatus":"GREEN"}
[Telemetry] Published successfully
```

### Troubleshooting:

#### Error: `[Azure] Connection failed, error code: -4`
**Penyebab:** WiFi tidak terhubung  
**Solusi:** Cek WIFI_SSID dan WIFI_PASSWORD

#### Error: `[Azure] Connection failed, error code: -2`
**Penyebab:** SAS token invalid atau expired  
**Solusi:** Generate SAS token baru dan update di code

#### Error: `[Azure] Connection failed, error code: 5`
**Penyebab:** Koneksi ditolak server  
**Solusi:** Cek Device ID, username format, atau firewall

---

## Langkah 5: Verifikasi di Azure

### Menggunakan Azure IoT Explorer:
1. Buka Azure IoT Explorer
2. Connect ke IoT Hub
3. Pilih Device → `esp32-smartclass-ti3b`
4. Tab "Telemetry" → Klik "Start"
5. Lihat data sensor yang diterima setiap 5 detik

### Menggunakan Azure Portal:
1. Go to: IoT Hub → Devices → esp32-smartclass-ti3b
2. View "Device Properties"
3. Lihat Last Activity timestamp update

---

## Topik MQTT yang Digunakan

### Telemetry (Kirim data sensor):
```
devices/esp32-smartclass-ti3b/messages/events/
```

### Commands (Terima pesan dari cloud):
```
devices/esp32-smartclass-ti3b/messages/devicebound/#
```

### Message Format:
```json
{
  "temperature": 25.5,
  "humidity": 60.2,
  "peopleCount": 5,
  "motionCount": 12,
  "motionDuration": 2.75,
  "roomStatus": "OCCUPIED",
  "ledStatus": "RED"
}
```

---

## Important Notes

1. **WiFiClientSecure**: Kode menggunakan `espClient.setInsecure()` untuk testing. Dalam production, gunakan proper CA certificate.

2. **SAS Token Expiry**: SAS token memiliki waktu kadaluarsa. Jika koneksi gagal setelah beberapa hari, generate token baru.

3. **NTP Time Sync**: System meng-set waktu dari internet (pool.ntp.org). Penting untuk certificate validation.

4. **Buffer Size**: MQTT buffer size di-set 512 bytes untuk accommodate larger payloads.

---

## Debugging Tips

### Check WiFi Connection:
- Lihat IP Address di Serial Monitor
- Pastikan signal strength cukup

### Check MQTT Connection:
- Verifikasi SAS Token format
- Cek Device ID sesuai dengan IoT Hub
- Cek clock/NTP time sync

### Monitor Telemetry:
- Lihat JSON payload di Serial Monitor
- Cross-check dengan Azure IoT Hub
- Verifikasi sensor data valid (bukan NaN atau error)

---

## Konfigurasi Penting di Code

```cpp
// Line 27-29: Azure Connection Settings
const char* MQTT_BROKER = "iothub-smart-classroom.azure-devices.net";
const int MQTT_PORT = 8883;
const char* DEVICE_ID = "esp32-smartclass-ti3b";

// Line 35: SAS Token (PERLU DIGANTI)
const char* SAS_TOKEN = "YOUR_TOKEN_HERE";

// Line 88: Telemetry Send Interval
const unsigned long printInterval = 5000;  // 5 seconds

// Line 90: MQTT Reconnect Interval
const unsigned long mqttReconnectInterval = 5000;  // 5 seconds
```

---

## Success Indicators

✅ WiFi Connected  
✅ MQTT Connected to Azure IoT Hub  
✅ Telemetry Published Successfully  
✅ Data muncul di Azure IoT Hub  
✅ LED Indicators (RED/GREEN) berfungsi  
✅ Sensor data valid (temp, humidity, people count)  

Semua indikator tersebut harus terpenuhi agar setup berhasil!
