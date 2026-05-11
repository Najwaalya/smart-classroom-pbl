# 📅 LOGIKA STATUS JADWAL - Smart Classroom

## 🎯 Overview

Sistem status khusus untuk **halaman jadwal** yang menggunakan logika berbasis sensor (IR + PIR) untuk menentukan status ruangan secara real-time.

**PENTING:** Logika ini **HANYA** diterapkan di halaman jadwal (`/schedule`). Dashboard tetap menggunakan status sederhana (active, uncertain, empty).

---

## 📋 Kondisi Status (Update)

### **PENTING: Logika Jam Pertama vs Jam Ke-2+**

**Jam Pertama (0-50 menit):**
- Toleransi untuk keterlambatan
- Status: "Scheduled" (Terjadwal)
- Mahasiswa masih bisa masuk tanpa booking

**Jam Ke-2 dan Seterusnya (>50 menit):**
- Jika tidak ada aktivitas → **OTOMATIS KOSONG**
- Ketua kelas **HARUS BOOKING ULANG**
- Status: "Empty" dengan pesan khusus

---

### **1. Ada jadwal + ada gerakan/orang = Active** 🟢
```
Kondisi:
- hasSchedule = true
- pirActivity = true ATAU students > 0

Status: ACTIVE
Label: "Kelas Aktif"
Description: "Perkuliahan sedang berlangsung"
```

**Penjelasan:** Kelas sedang berlangsung dengan aktivitas normal.

---

### **2. Ada jadwal + JAM PERTAMA (0-50 menit) + belum ada gerakan = Scheduled** 🔵
```
Kondisi:
- hasSchedule = true
- minutesSinceStart <= 50
- students = 0
- pirActivity = false

Status: SCHEDULED
Label: "Terjadwal"
Description: "Menunggu aktivitas (X menit sejak jadwal dimulai)"
```

**Penjelasan:** 
- Kelas sudah terjadwal tapi belum dimulai
- Masih dalam **toleransi 50 menit pertama**
- Mahasiswa bisa langsung masuk tanpa booking

**Contoh:**
- Jadwal: 07:00 - 09:30
- Waktu sekarang: 07:20 (20 menit sejak mulai)
- Status: **Scheduled** ✅ (masih dalam toleransi)

---

### **3. Ada jadwal + JAM KE-2+ (>50 menit) + tidak ada gerakan = Empty** ⚪
```
Kondisi:
- hasSchedule = true
- minutesSinceStart > 50
- students = 0
- pirActivity = false

Status: EMPTY
Label: "Kosong"
Description: "Tidak ada aktivitas >50 menit. Jadwal otomatis kosong. Ketua kelas harus booking ulang."
```

**Penjelasan:**
- Sudah lewat **50 menit sejak jadwal dimulai**
- Tidak ada aktivitas sama sekali
- Jadwal **OTOMATIS DIKOSONGKAN**
- Ketua kelas **HARUS BOOKING ULANG** jika ingin menggunakan ruangan

**Contoh:**
- Jadwal: 07:00 - 09:30
- Waktu sekarang: 07:55 (55 menit sejak mulai)
- Status: **Empty** ❌ (otomatis kosong, harus booking ulang)

**Alur Booking Ulang:**
1. Ketua kelas buka halaman "Booking Ruangan"
2. Pilih ruangan yang sama
3. Pilih waktu yang tersisa (misal: 08:00 - 09:30)
4. Isi keperluan: "Lanjutan Perkuliahan"
5. Booking berhasil → Ruangan bisa digunakan

---

### **4. Ada jadwal + tidak ada gerakan 20 menit + people > 0 = Uncertain** 🟡
```
Kondisi:
- hasSchedule = true
- lastMotionMinutes >= 20
- students > 0

Status: UNCERTAIN
Label: "Tidak Pasti"
Description: "Ada X orang tapi tidak ada gerakan Y menit (cek manual)"
```

**Penjelasan:** Ada orang di ruangan tapi tidak ada gerakan dalam 20 menit. Perlu pengecekan manual.

---

### **5. Tidak ada jadwal + ada aktivitas = Active** 🟢
```
Kondisi:
- hasSchedule = false
- pirActivity = true ATAU students > 0

Status: ACTIVE
Label: "Aktif"
Description: "Ada aktivitas di luar jadwal"
```

**Penjelasan:** Ada aktivitas di luar jadwal (belajar mandiri, rapat, dll).

---

### **6. Tidak ada jadwal + tidak ada aktivitas 20 menit = Empty** ⚪
```
Kondisi:
- hasSchedule = false
- lastMotionMinutes >= 20 ATAU students = 0

Status: EMPTY
Label: "Kosong"
Description: "Tidak ada jadwal dan tidak ada aktivitas"
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
Description: "Ruangan sudah dibooking mahasiswa"
```

**Penjelasan:** Ruangan sudah dibooking oleh mahasiswa.

---

## 🔧 Implementasi

### **File Utama:**

#### 1. **`src/lib/schedule-status.ts`**
Berisi logika utama untuk menghitung status ruangan di jadwal.

```typescript
export function getScheduleStatus(
  roomId: string,
  sensorData: RoomSensorData,
  bookings: BookingData[]
): ScheduleStatusResult
```

**Input:**
- `roomId`: ID ruangan
- `sensorData`: Data sensor (students, pirActivity, lastMotionMinutes)
- `bookings`: Array booking mahasiswa

**Output:**
- `status`: Status ruangan
- `label`: Label untuk ditampilkan
- `color`: Warna text
- `bgColor`: Warna background

---

#### 2. **`src/app/(dashboard)/schedule/page.tsx`**
Halaman jadwal yang menggunakan logika status baru.

**Perubahan:**
- Import `getScheduleStatus` dari `schedule-status.ts`
- Update `getRoomStatus()` untuk menggunakan logika baru
- Sensor data disimulasikan (nanti diganti dengan data real)

---

#### 3. **`src/components/schedule/RoomStatusBadge.tsx`**
Badge status untuk ditampilkan di grid jadwal.

**Support 5 status:**
- Active (Hijau)
- Scheduled (Biru)
- Uncertain (Kuning)
- Empty (Abu-abu)
- Booked (Ungu)

---

## 📊 Data Sensor

### **Struktur Data:**

```typescript
interface RoomSensorData {
  students: number;          // Jumlah orang dari IR sensor
  pirActivity: boolean;      // Ada gerakan atau tidak (dari PIR)
  lastMotionMinutes: number; // Berapa menit sejak gerakan terakhir
}
```

### **Sensor yang Digunakan:**

| Sensor | Fungsi | Output |
|--------|--------|--------|
| **IR Sensor** | Menghitung orang masuk/keluar | `students` (integer) |
| **PIR Sensor** | Deteksi gerakan | `pirActivity` (boolean) |
| **Timer** | Tracking waktu gerakan terakhir | `lastMotionMinutes` (integer) |

---

## 🎨 UI Components

### **Halaman Jadwal:**
- ✅ Grid jadwal dengan status real-time
- ✅ Badge status per ruangan
- ✅ Quick booking untuk slot kosong
- ✅ Filter lantai dan hari

### **Status Badge:**
- ✅ 5 warna berbeda per status
- ✅ Menampilkan jumlah mahasiswa
- ✅ Compact design untuk grid

---

## 🔄 Data Flow

```
1. User buka halaman /schedule
   ↓
2. Load data ruangan dari RoomDataContext
   ↓
3. Load bookings dari localStorage
   ↓
4. Untuk setiap ruangan:
   - Ambil sensor data (students, PIR, lastMotion)
   - Call getScheduleStatus()
   - Tentukan status berdasarkan 7 kondisi
   ↓
5. Render grid dengan status yang sesuai
```

---

## ⚙️ Konfigurasi Waktu

| Parameter | Nilai | Keterangan |
|-----------|-------|------------|
| **Jam Pertama (Toleransi)** | 0-50 menit | Mahasiswa bisa langsung masuk |
| **Jam Ke-2+ (Auto-Cancel)** | >50 menit | Jadwal otomatis kosong, harus booking ulang |
| **Uncertain Timeout** | 20 menit | Tidak ada gerakan = uncertain |
| **Empty Timeout** | 20 menit | Tidak ada aktivitas = empty |

---

## 🔄 Alur Booking Ulang (Jam Ke-2+)

### **Kondisi:**
- Jadwal kelas sudah dimulai >50 menit
- Tidak ada aktivitas sama sekali
- Status: **EMPTY** (otomatis kosong)

### **Langkah-langkah:**

#### **1. Sistem Mendeteksi**
```
Jadwal: 07:00 - 09:30
Waktu sekarang: 07:55 (55 menit sejak mulai)
Status: EMPTY ❌
Pesan: "Tidak ada aktivitas >50 menit. Jadwal otomatis kosong."
```

#### **2. Ketua Kelas Booking Ulang**
```
1. Buka halaman "Booking Ruangan"
2. Pilih ruangan yang sama (misal: RT04_5B)
3. Pilih hari: Senin (hari ini)
4. Pilih waktu mulai: 08:00 (waktu sekarang atau lebih)
5. Pilih waktu selesai: 09:30 (sesuai jadwal asli)
6. Isi keperluan: "Lanjutan Perkuliahan [Nama Matkul]"
7. Isi jumlah orang: 30
8. Klik "Booking Sekarang"
```

#### **3. Validasi Booking**
```
✅ Waktu valid (08:00 - 09:30)
✅ Tidak bentrok dengan jadwal lain
✅ Tidak bentrok dengan booking lain
✅ Durasi minimal 30 menit
✅ Durasi maksimal 4 jam
```

#### **4. Booking Berhasil**
```
Status ruangan: BOOKED 🟣
Label: "Dibooking"
Mahasiswa bisa masuk dan menggunakan ruangan
```

#### **5. Sensor Mendeteksi Aktivitas**
```
Mahasiswa masuk → IR sensor detect
PIR sensor detect gerakan
Status berubah: BOOKED → ACTIVE 🟢
```

### **Timeline Contoh:**
```
07:00 - Jadwal dimulai
07:00-07:50 - Status: SCHEDULED (toleransi jam pertama)
07:55 - Status: EMPTY (>50 menit, otomatis kosong)
08:00 - Ketua kelas booking ulang (08:00-09:30)
08:00 - Status: BOOKED
08:05 - Mahasiswa masuk, sensor detect
08:05 - Status: ACTIVE
09:30 - Kelas selesai
```

---

## 📱 Notifikasi & Alert

### **Notifikasi untuk Ketua Kelas:**
```
⚠️ PERHATIAN!
Ruangan RT04_5B sudah >50 menit tidak ada aktivitas.
Jadwal otomatis dikosongkan.

Silakan booking ulang jika ingin melanjutkan perkuliahan.

[Booking Sekarang]
```

### **Notifikasi untuk Admin:**
```
ℹ️ INFO
Jadwal kelas RT04_5B (07:00-09:30) otomatis kosong.
Tidak ada aktivitas sejak 07:55.

Status: EMPTY
Action: Menunggu booking ulang dari ketua kelas
```

---

## 🧪 Testing Scenarios

### **Skenario 1: Kelas Normal (Jam Pertama)**
```
Input:
- Jadwal: 07:00 - 09:30
- Waktu sekarang: 07:20 (20 menit sejak mulai)
- students = 30
- pirActivity = true

Expected: ACTIVE ✅
Keterangan: Kelas berjalan normal
```

### **Skenario 2: Kelas Belum Dimulai (Jam Pertama - Toleransi)**
```
Input:
- Jadwal: 07:00 - 09:30
- Waktu sekarang: 07:15 (15 menit sejak mulai)
- students = 0
- pirActivity = false

Expected: SCHEDULED ✅
Keterangan: Masih dalam toleransi 50 menit pertama
```

### **Skenario 3: Kelas Terlambat (Jam Pertama - Masih Toleransi)**
```
Input:
- Jadwal: 07:00 - 09:30
- Waktu sekarang: 07:45 (45 menit sejak mulai)
- students = 0
- pirActivity = false

Expected: SCHEDULED ✅
Keterangan: Masih dalam toleransi 50 menit, mahasiswa bisa langsung masuk
```

### **Skenario 4: Jam Ke-2 - Otomatis Kosong** ⚠️
```
Input:
- Jadwal: 07:00 - 09:30
- Waktu sekarang: 07:55 (55 menit sejak mulai)
- students = 0
- pirActivity = false

Expected: EMPTY ❌
Keterangan: Sudah >50 menit, jadwal OTOMATIS KOSONG
Action: Ketua kelas HARUS BOOKING ULANG
```

### **Skenario 5: Jam Ke-2 - Booking Ulang Berhasil**
```
Alur:
1. Jadwal otomatis kosong (55 menit sejak mulai)
2. Ketua kelas buka halaman Booking
3. Pilih ruangan yang sama
4. Pilih waktu: 08:00 - 09:30
5. Isi keperluan: "Lanjutan Perkuliahan"
6. Booking berhasil

Expected: BOOKED 🟣
Keterangan: Ruangan bisa digunakan setelah booking ulang
```

### **Skenario 6: Kelas Diam (Ada Orang Tapi Tidak Bergerak)**
```
Input:
- Jadwal: 07:00 - 09:30
- Waktu sekarang: 07:30
- students = 25
- pirActivity = false
- lastMotionMinutes = 25

Expected: UNCERTAIN ⚠️
Keterangan: Ada orang tapi tidak ada gerakan, perlu cek manual
```

### **Skenario 7: Belajar Mandiri (Tidak Ada Jadwal)**
```
Input:
- Jadwal: Tidak ada
- students = 10
- pirActivity = true

Expected: ACTIVE ✅
Keterangan: Ada aktivitas di luar jadwal
```

### **Skenario 8: Ruangan Kosong**
```
Input:
- Jadwal: Tidak ada
- students = 0
- pirActivity = false
- lastMotionMinutes = 30

Expected: EMPTY ⚪
Keterangan: Ruangan benar-benar kosong
```

---

## 📝 Notes

### **Perbedaan dengan Dashboard:**
- **Dashboard:** Status sederhana (active, uncertain, empty) - tidak berubah
- **Jadwal:** Status lengkap dengan 7 kondisi - menggunakan logika baru

### **Simulasi vs Real Data:**
- Saat ini sensor data disimulasikan
- Nanti akan diganti dengan data real dari ESP32
- Struktur data sudah siap untuk integrasi

### **Auto-Cancel Booking:**
- Jika ruangan sudah dibooking tapi sensor deteksi ada orang
- Booking akan otomatis dibatalkan
- Implementasi ada di halaman booking

---

## 🚀 Future Improvements

1. **Real Sensor Integration** - Integrasi dengan ESP32
2. **Historical Data** - Tracking status history
3. **Predictive Analytics** - Prediksi status berdasarkan pattern
4. **Notifications** - Alert untuk status uncertain
5. **Auto-Reschedule** - Otomatis reschedule jika kelas dibatalkan

---

**Tanggal:** 11 Mei 2026  
**Developer:** Kiro AI Assistant  
**Version:** 2.2.0
