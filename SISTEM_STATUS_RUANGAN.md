# 📊 SISTEM STATUS RUANGAN - Smart Classroom

## 🎯 Overview

Sistem status ruangan yang baru menggunakan **logika berbasis sensor** untuk menentukan status ruangan secara real-time berdasarkan:
- **Jadwal kelas** (dari database jadwal)
- **Sensor IR** (people counting)
- **Sensor PIR** (deteksi gerakan)
- **Booking mahasiswa** (dari localStorage)

---

## 🔄 Status yang Tersedia

| Status | Warna | Deskripsi |
|--------|-------|-----------|
| **Active** | 🟢 Hijau | Ada aktivitas (gerakan + orang) |
| **Scheduled** | 🔵 Biru | Ada jadwal tapi belum ada aktivitas |
| **Uncertain** | 🟡 Kuning | Ada orang tapi tidak ada gerakan (perlu cek manual) |
| **Empty** | ⚪ Abu-abu | Tidak ada aktivitas |
| **Booked** | 🟣 Ungu | Sudah dibooking mahasiswa |

---

## 📋 Logika Status (Kondisi)

### **1. Ada jadwal + ada gerakan/orang = Active** 🟢
```
Kondisi:
- hasSchedule = true
- pirActivity > 10 ATAU lastMotion < 5 menit
- students > 0

Status: ACTIVE
Label: "Kelas Aktif"
Deskripsi: "Perkuliahan sedang berlangsung"
```

---

### **2. Ada jadwal + belum ada pergerakan selama 50 menit pertama = Scheduled** 🔵
```
Kondisi:
- hasSchedule = true
- minutesSinceMotion < 50
- students = 0

Status: SCHEDULED
Label: "Terjadwal"
Deskripsi: "Menunggu aktivitas perkuliahan"
```

**Penjelasan:** Kelas sudah terjadwal tapi belum dimulai. Masih dalam toleransi 50 menit pertama.

---

### **3. Ada jadwal + tidak ada gerakan lama (20 menit) + people count > 0 = Uncertain** 🟡
```
Kondisi:
- hasSchedule = true
- minutesSinceMotion >= 20
- students > 0

Status: UNCERTAIN
Label: "Tidak Pasti"
Deskripsi: "Ada X orang tapi tidak ada gerakan (cek manual)"
```

**Penjelasan:** Ada orang di ruangan tapi tidak ada gerakan dalam 20 menit. Kemungkinan:
- Sensor PIR error
- Mahasiswa diam semua (ujian/presentasi)
- Perlu pengecekan manual

---

### **4. Ada jadwal + tidak ada aktivitas dalam 50 menit + people count = 0 = Empty** ⚪
```
Kondisi:
- hasSchedule = true
- minutesSinceMotion >= 50
- students = 0

Status: EMPTY
Label: "Kosong"
Deskripsi: "Tidak ada aktivitas dalam 50 menit (kelas dibatalkan)"
```

**Penjelasan:** Kelas terjadwal tapi tidak ada aktivitas dalam 50 menit pertama. Kemungkinan:
- Dosen tidak hadir
- Kelas dibatalkan
- **Status kelas di jam selanjutnya otomatis dikosongkan**

---

### **5. Tidak ada jadwal + ada aktivitas = Active** 🟢
```
Kondisi:
- hasSchedule = false
- pirActivity > 10 ATAU lastMotion < 5 menit
- students > 0

Status: ACTIVE
Label: "Aktif"
Deskripsi: "Ada aktivitas di luar jadwal"
```

**Penjelasan:** Ada aktivitas di luar jadwal kelas. Kemungkinan:
- Belajar mandiri
- Rapat organisasi
- Kegiatan lain

---

### **6. Tidak ada jadwal + tidak ada aktivitas dalam 20 menit = Empty** ⚪
```
Kondisi:
- hasSchedule = false
- minutesSinceMotion >= 20 ATAU students = 0

Status: EMPTY
Label: "Kosong"
Deskripsi: "Tidak ada jadwal dan tidak ada aktivitas"
```

**Penjelasan:** Ruangan benar-benar kosong dan tidak ada jadwal.

---

### **7. Tidak ada jadwal + sudah dibooking = Booked** 🟣
```
Kondisi:
- hasSchedule = false
- hasBooking = true

Status: BOOKED
Label: "Dibooking"
Deskripsi: "Ruangan sudah dibooking mahasiswa"
```

**Penjelasan:** Ruangan sudah dibooking oleh mahasiswa untuk kegiatan tertentu.

---

## 🔧 Implementasi Teknis

### **File Utama:**

#### 1. **`src/lib/room-status.ts`**
Berisi logika utama untuk menghitung status ruangan.

```typescript
export function calculateRoomStatus(
  sensorData: RoomSensorData,
  bookings: BookingData[] = []
): RoomStatusResult
```

**Input:**
- `sensorData`: Data dari sensor (students, pirActivity, lastMotionTime, temp, humidity)
- `bookings`: Array booking mahasiswa

**Output:**
- `status`: Status ruangan (active, scheduled, uncertain, empty, booked)
- `label`: Label untuk ditampilkan
- `description`: Deskripsi detail
- `color`, `bgColor`, `borderColor`: Warna untuk UI

---

#### 2. **`src/contexts/RoomDataContext.tsx`**
Context untuk state management data ruangan.

**Perubahan:**
- Menambahkan field `pirActivity` dan `lastMotionTime`
- Menghapus field `pir` (array)
- Menambahkan `statusLabel` dan `statusDescription`
- Integrasi dengan `calculateRoomStatus()`

---

#### 3. **`src/components/dashboard/RoomCard.tsx`**
Komponen card ruangan di dashboard.

**Perubahan:**
- Menampilkan 5 status (active, scheduled, uncertain, empty, booked)
- Menampilkan PIR activity (%)
- Menampilkan status description

---

## 📊 Data Sensor

### **Sensor yang Digunakan:**

| Sensor | Fungsi | Output |
|--------|--------|--------|
| **IR Sensor** | Menghitung orang masuk/keluar | `students` (integer) |
| **PIR Sensor** | Deteksi gerakan | `pirActivity` (0-100%) |
| **DHT11** | Suhu & kelembaban | `temp` (°C), `humidity` (%) |

### **Struktur Data Sensor:**

```typescript
interface RoomSensorData {
  id: string;
  students: number;        // Jumlah orang dari IR sensor
  pirActivity: number;     // Level aktivitas PIR (0-100)
  lastMotionTime: Date;    // Waktu terakhir ada gerakan
  temp: number;
  humidity: number;
}
```

---

## 🎨 UI Components

### **Dashboard:**
- **MetricCard**: Menampilkan jumlah ruangan per status
- **RoomCard**: Card ruangan dengan status, sensor data, dan PIR activity
- **SearchFilter**: Filter ruangan berdasarkan status (6 filter)

### **Schedule:**
- **ScheduleGrid**: Grid jadwal dengan status real-time
- **RoomStatusBadge**: Badge status kecil di grid

---

## 🔄 Data Flow

```
1. ESP32 → Sensor Data (IR, PIR, DHT)
   ↓
2. Backend API → MySQL Database
   ↓
3. Frontend → Fetch API (/api/iot/sync)
   ↓
4. RoomDataContext → calculateRoomStatus()
   ↓
5. Components → Render dengan status baru
```

---

## ⚙️ Konfigurasi Waktu

| Parameter | Nilai | Keterangan |
|-----------|-------|------------|
| **Motion Timeout** | 5 menit | Gerakan dianggap aktif jika < 5 menit |
| **Scheduled Timeout** | 50 menit | Toleransi menunggu aktivitas |
| **Uncertain Timeout** | 20 menit | Tidak ada gerakan = uncertain |
| **Empty Timeout** | 20 menit | Tidak ada aktivitas = empty |

---

## 🧪 Testing

### **Skenario Testing:**

1. **Kelas Normal**
   - Ada jadwal + ada mahasiswa + ada gerakan → **Active** ✅

2. **Kelas Belum Dimulai**
   - Ada jadwal + belum ada mahasiswa (< 50 menit) → **Scheduled** ✅

3. **Kelas Diam**
   - Ada jadwal + ada mahasiswa + tidak ada gerakan (> 20 menit) → **Uncertain** ⚠️

4. **Kelas Dibatalkan**
   - Ada jadwal + tidak ada aktivitas (> 50 menit) → **Empty** ❌

5. **Belajar Mandiri**
   - Tidak ada jadwal + ada aktivitas → **Active** ✅

6. **Ruangan Kosong**
   - Tidak ada jadwal + tidak ada aktivitas → **Empty** ⚪

7. **Booking Mahasiswa**
   - Tidak ada jadwal + ada booking → **Booked** 🟣

---

## 📈 Metrics Dashboard

Dashboard menampilkan 5 metrics:

1. **Kelas Aktif** (Hijau) - Ruangan yang sedang digunakan
2. **Terjadwal** (Biru) - Ruangan yang terjadwal tapi belum aktif
3. **Tidak Pasti** (Kuning) - Ruangan yang perlu cek manual
4. **Kosong** (Abu-abu) - Ruangan yang tidak digunakan
5. **Dibooking** (Ungu) - Ruangan yang dibooking mahasiswa

---

## 🚨 Auto-Cancel Booking

Jika ruangan sudah dibooking tapi sensor mendeteksi:
- `students > 0`
- `status = active`

Maka booking akan **otomatis dibatalkan** karena ruangan sudah terisi.

---

## 🔮 Future Improvements

1. **Machine Learning** - Prediksi status berdasarkan historical data
2. **Notifikasi Push** - Alert untuk status uncertain
3. **Auto-Reschedule** - Otomatis reschedule jika kelas dibatalkan
4. **Heatmap** - Visualisasi penggunaan ruangan per hari/minggu
5. **API Integration** - Integrasi dengan sistem akademik

---

**Tanggal Update:** 11 Mei 2026  
**Developer:** Kiro AI Assistant  
**Version:** 2.0.0
