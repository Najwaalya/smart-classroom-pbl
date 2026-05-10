# 🤖 Fitur Otomatisasi Smart Classroom

## Overview
Sistem booking ruangan kelas dengan **otomatisasi berbasis sensor dan rules** tanpa AI/Machine Learning. Fokus pada automasi real-time dan logic-based decision making.

---

## ✨ Fitur Otomatisasi

### 1. **Auto-Cancel Booking** 🔴
**Otomatis batalkan booking jika ruangan terdeteksi terisi**

**Cara Kerja:**
```typescript
// Cek setiap 30 detik
if (sensor.students > 0 && sensor.status === "active") {
  // Jika ada orang di ruangan saat jam booking
  cancelBooking();
}
```

**Trigger:**
- Sensor PIR mendeteksi ada orang (students > 0)
- Status ruangan = "active"
- Waktu sudah masuk jam booking

**Hasil:**
- Booking otomatis dibatalkan
- Notifikasi muncul ke user
- Ruangan kembali tersedia untuk booking lain

---

### 2. **Auto Color Change** 🎨
**Kotak jadwal otomatis berubah warna sesuai status**

**Warna:**
- 🟢 **Hijau** = Kosong / Tersedia
- 🔴 **Merah** = Ada jadwal kelas / Terbooked
- 🔴 **Merah + Ring** = Booking milik saya

**Logic:**
```typescript
if (hasSchedule || hasBooking) {
  return "red"; // Merah
} else {
  return "green"; // Hijau
}
```

**Update Real-time:**
- Berubah otomatis saat booking dibuat
- Berubah otomatis saat booking dibatalkan
- Berubah otomatis saat jadwal di-reschedule

---

### 3. **Auto Green After Class** 🟢
**Kotak otomatis hijau setelah jam kelas selesai**

**Cara Kerja:**
```typescript
const now = new Date();
const schedEndMin = toMin(schedule.end);

if (nowMin >= schedEndMin) {
  return "green"; // Otomatis hijau
}
```

**Contoh:**
- Jadwal kelas: 07:30 - 10:10
- Jam sekarang: 10:15
- Status: Otomatis berubah hijau ✅

---

### 4. **Slot-Based Booking** ⏰
**Booking mengikuti slot jadwal yang sudah ditentukan**

**Slot Waktu:**
```typescript
Slot 1:  07:00 - 07:50
Slot 2:  07:50 - 08:40
Slot 3:  08:40 - 09:30
Slot 4:  09:40 - 10:30
Slot 5:  10:30 - 11:20
Slot 6:  11:20 - 12:10
Slot 7:  12:50 - 13:40
Slot 8:  13:40 - 14:30
Slot 9:  14:30 - 15:20
Slot 10: 15:30 - 16:20
Slot 11: 16:20 - 17:10
Slot 12: 17:10 - 18:00
```

**Fitur:**
- Mahasiswa pilih slot (bukan input jam manual)
- Slot yang ada jadwal kelas otomatis diblokir
- Bisa pilih multiple slots sekaligus
- Durasi otomatis dihitung

---

### 5. **Auto Reschedule Logic** 🔄
**Jam lama otomatis hijau saat jadwal diubah**

**Cara Kerja:**
```typescript
// Mahasiswa ubah jadwal kelas
rescheduleClass(roomId, oldDay, oldStart, oldEnd, newDay, newStart, newEnd);

// Sistem otomatis:
1. Simpan jadwal baru
2. Jam lama return null (hijau)
3. Jam baru tampil merah
4. Update real-time
```

**Contoh:**
```
Jadwal Awal:
- Senin 07:30-10:10 → Merah 🔴

Mahasiswa Ubah ke:
- Senin 13:00-15:30

Hasil Otomatis:
- Senin 07:30-10:10 → Hijau 🟢 (tersedia untuk booking)
- Senin 13:00-15:30 → Merah 🔴 (jadwal baru)
```

**Logic:**
```typescript
function getActiveScheduleForSlot(roomId, day, slot) {
  const sched = findSchedule(roomId, day, slot);
  
  // Cek apakah di-reschedule
  const resched = rescheduledClasses[scheduleKey];
  if (resched) {
    // Jika hari berbeda, jam lama jadi null (hijau)
    if (resched.newDay !== day) return null;
    
    // Jika jam berbeda, cek apakah slot masuk jam baru
    if (slot not in newTime) return null; // Hijau
    
    // Return jadwal baru
    return { ...sched, start: newStart, end: newEnd };
  }
  
  return sched;
}
```

---

### 6. **Auto Cancel Schedule** ⚠️
**Kosongkan kelas otomatis saat dosen berhalangan**

**Cara Kerja:**
```typescript
// Mahasiswa klik "Kosongkan Kelas"
cancelSchedule(roomId, day, start, end);

// Sistem otomatis:
1. Tandai jadwal sebagai cancelled
2. Jam tersebut return null (hijau)
3. Tersedia untuk booking
```

**Hasil:**
- Jadwal kelas hilang dari grid
- Kotak berubah hijau
- Mahasiswa lain bisa booking

---

### 7. **Real-time Sensor Integration** 📡
**Integrasi dengan sensor IoT untuk data live**

**Data Sensor:**
```typescript
{
  students: number,      // Jumlah orang (PIR sensor)
  temp: number,          // Suhu ruangan (°C)
  status: string,        // active/empty/uncertain
  lastActivity: string   // Timestamp terakhir
}
```

**Penggunaan:**
- Auto-cancel booking
- Live occupancy display
- Status monitoring
- Temperature tracking

**Update:**
- Real-time via WebSocket/Polling
- Display di kartu ruangan
- Display di grid jadwal

---

### 8. **Conflict Detection** ⚠️
**Deteksi konflik otomatis saat booking**

**Cara Kerja:**
```typescript
// Cek konflik dengan jadwal kelas
const conflict = schedules.find(s =>
  s.room === roomId &&
  s.day === day &&
  timeOverlap(bookingTime, scheduleTime)
);

if (conflict) {
  showError("Bentrok dengan jadwal kelas");
  blockBooking();
}
```

**Cek:**
- Jadwal kelas resmi
- Booking yang sudah ada
- Jadwal yang di-reschedule
- Jadwal yang dibatalkan

---

## 🔧 Technical Implementation

### State Management
```typescript
// Booking state
const [localBookings, setLocalBookings] = useState<BookingRecord[]>([]);

// Reschedule state
const [rescheduledClasses, setRescheduledClasses] = useState<Record<string, {
  newDay: string;
  newStart: string;
  newEnd: string;
}>>({});

// Cancel state
const [cancelledSchedules, setCancelledSchedules] = useState<Set<string>>(new Set());
```

### Auto-Cancel Timer
```typescript
useEffect(() => {
  autoCancel(); // Run once on mount
  const interval = setInterval(autoCancel, 30_000); // Every 30 seconds
  return () => clearInterval(interval);
}, [autoCancel]);
```

### Color Logic
```typescript
function getBoxColor(roomId, day, slot) {
  const booking = getBookingForSlot(roomId, day, slot);
  const sched = getActiveScheduleForSlot(roomId, day, slot);
  
  // Priority:
  // 1. Check if class ended → Green
  // 2. Check if has schedule → Red
  // 3. Check if has booking → Red
  // 4. Default → Green
  
  if (sched && classEnded) return "green";
  if (sched) return "red";
  if (booking) return "red";
  return "green";
}
```

---

## 📊 Data Flow

```
User Action → State Update → Logic Check → UI Update
     ↓              ↓              ↓            ↓
  Booking      localBookings   Conflict?   Color Change
  Reschedule   rescheduled     Sensor?     Grid Update
  Cancel       cancelled       Time?       Status Update
```

---

## 🎯 Use Cases

### Use Case 1: Booking Ruangan
```
1. Mahasiswa pilih lantai & hari
2. Sistem tampilkan grid dengan warna:
   - Hijau = tersedia
   - Merah = tidak tersedia
3. Mahasiswa pilih slot hijau
4. Sistem cek konflik
5. Jika OK, booking berhasil
6. Kotak otomatis berubah merah
```

### Use Case 2: Dosen Mundur Jam
```
1. Mahasiswa klik kotak merah (jadwal kelas)
2. Pilih "Ubah Jam Kelas"
3. Input jam baru
4. Sistem otomatis:
   - Jam lama → Hijau (tersedia)
   - Jam baru → Merah (jadwal baru)
5. Mahasiswa lain bisa booking jam lama
```

### Use Case 3: Dosen Berhalangan
```
1. Mahasiswa klik kotak merah (jadwal kelas)
2. Pilih "Kosongkan Kelas"
3. Sistem otomatis:
   - Jadwal dibatalkan
   - Kotak berubah hijau
   - Tersedia untuk booking
```

### Use Case 4: Auto-Cancel
```
1. Mahasiswa booking RT01 jam 08:00-10:00
2. Jam 08:05, sensor deteksi ada 5 orang
3. Sistem cek: booking aktif + ruangan terisi
4. Sistem otomatis:
   - Batalkan booking
   - Notifikasi ke mahasiswa
   - Kotak kembali hijau
```

---

## 🚀 Performance

### Optimization
- **Memoization**: useMemo untuk perhitungan berat
- **Debouncing**: Auto-cancel setiap 30 detik (bukan real-time)
- **Lazy Loading**: Component dimuat saat dibutuhkan
- **State Batching**: Multiple updates di-batch

### Scalability
- **Local State**: Tidak perlu server untuk logic
- **Efficient Checks**: O(n) complexity untuk conflict detection
- **Minimal Re-renders**: Hanya update yang berubah

---

## 🔐 Security & Validation

### Input Validation
```typescript
// Validasi booking
if (!userInfo) return error("Harus login");
if (slots.length === 0) return error("Pilih slot");
if (conflict) return error("Ada konflik");
```

### Authorization
```typescript
// Hanya mahasiswa bisa booking
if (role !== "mahasiswa") return;

// Hanya pemilik bisa cancel
if (booking.bookedById !== userId) return;
```

---

## 📝 Summary

### Fitur Otomatisasi:
✅ Auto-cancel booking (sensor-based)
✅ Auto color change (status-based)
✅ Auto green after class (time-based)
✅ Slot-based booking (rule-based)
✅ Auto reschedule logic (state-based)
✅ Auto cancel schedule (user-triggered)
✅ Real-time sensor integration
✅ Conflict detection (logic-based)

### Tidak Ada:
❌ AI/Machine Learning
❌ Predictive analytics
❌ Recommendations
❌ Voice commands
❌ Smart notifications
❌ Usage forecasting

### Fokus:
🎯 **Otomatisasi berbasis rules & sensor**
🎯 **Real-time updates**
🎯 **Simple & fast**
🎯 **Reliable & predictable**

---

**Built with ⚡ Automation & 📡 Sensors**
