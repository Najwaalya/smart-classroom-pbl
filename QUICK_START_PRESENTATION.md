# 🚀 QUICK START - PANDUAN PRESENTASI

**Status**: ✅ SIAP PRESENTASI  
**Tanggal**: 13 Mei 2026

---

## 📋 CHECKLIST SEBELUM PRESENTASI

### 1. Verifikasi Environment
```bash
# Pastikan .env.local ada dan berisi credentials Cosmos DB
cat .env.local
```

Harus ada:
- ✅ `COSMOS_ENDPOINT`
- ✅ `COSMOS_KEY`
- ✅ `COSMOS_DATABASE=smartclassdb`

### 2. Verifikasi Database
```bash
# Test koneksi ke Cosmos DB
node create-containers.mjs
```

Expected output: "✅ All containers verified/created"

### 3. Pastikan Ada Data
```bash
# Seed data jika database kosong
node seed.mjs
```

Expected output: "✅ Seed process completed successfully!"

### 4. Build & Run
```bash
# Install dependencies (jika belum)
npm install

# Build production
npm run build

# Run development server
npm run dev
```

Server akan berjalan di: **http://localhost:3000**

---

## 🎯 DEMO FLOW UNTUK PRESENTASI

### 1. **Login Page** (http://localhost:3000/login)

**Demo Admin (Dosen):**
- Email: `dosen@example.com`
- Password: `password123`
- Tunjukkan badge: **DOSEN** dengan **NIP:**

**Demo Mahasiswa:**
- Email: `mahasiswa@example.com`
- Password: `password123`
- Tunjukkan badge: **MAHASISWA** dengan **NIM:**

---

### 2. **Dashboard** (http://localhost:3000)

**Highlight:**
- ✅ Real-time room monitoring
- ✅ Metrics: Active, Empty, Uncertain rooms
- ✅ Room cards dengan sensor data (temp, humidity, students)
- ✅ Auto-refresh setiap 5 detik
- ✅ Search & filter functionality

**Demo:**
1. Tunjukkan jumlah ruangan aktif/kosong
2. Klik salah satu room card untuk detail
3. Tunjukkan data sensor real-time

---

### 3. **Schedule Page** (http://localhost:3000/schedule)

**Highlight:**
- ✅ Jadwal kelas dari Cosmos DB
- ✅ Filter by day (Monday - Friday)
- ✅ Tampilan timeline per ruangan
- ✅ Tidak ada data dummy

**Demo:**
1. Pilih hari (Monday, Tuesday, dll)
2. Tunjukkan jadwal kelas yang ada
3. Explain: Data dari database, bukan hardcoded

---

### 4. **Manage Schedule** (Admin Only - http://localhost:3000/manage-schedule)

**Highlight:**
- ✅ CRUD operations: Create, Edit, Delete
- ✅ Data tersimpan di Cosmos DB
- ✅ Validasi waktu dan ruangan

**Demo:**
1. **Create**: Tambah jadwal baru
   - Pilih ruangan
   - Pilih hari
   - Set waktu mulai & selesai
   - Isi mata kuliah, dosen, kelas
   - Klik "Tambah Jadwal"

2. **Edit**: Ubah jadwal existing
   - Klik tombol edit (pensil)
   - Ubah data
   - Simpan

3. **Delete**: Hapus jadwal
   - Klik tombol delete (trash)
   - Confirm

4. **Verify**: Refresh page, data tetap ada (dari DB)

---

### 5. **Booking Page** (Mahasiswa Only - http://localhost:3000/booking)

**Highlight:**
- ✅ Booking ruangan kosong
- ✅ Validasi: tidak bisa booking jika ada jadwal kelas
- ✅ Auto-cancel jika ruangan terisi
- ✅ Data tersimpan di Cosmos DB

**Demo:**
1. Login sebagai mahasiswa
2. Pilih lantai (5, 6, 7, 8)
3. Pilih hari
4. Pilih ruangan yang available (hijau)
5. Pilih time slot
6. Isi tujuan booking
7. Submit
8. Tunjukkan "Booking Saya" muncul di bawah
9. Cancel booking (klik X)

**Explain:**
- Slot merah = ada jadwal kelas (tidak bisa booking)
- Slot hijau = available untuk booking
- Auto-cancel jika sensor detect ruangan terisi

---

### 6. **Analytics Page** (Admin Only - http://localhost:3000/analytics)

**Highlight:**
- ✅ Real-time analytics dari sensor data
- ✅ KPI cards: Total rooms, active, average occupancy
- ✅ Occupancy chart (hourly)
- ✅ Room table dengan data terbaru
- ✅ Auto-refresh setiap 5 detik

**Demo:**
1. Tunjukkan KPI cards di atas
2. Scroll ke chart: Occupancy & Temperature
3. Tunjukkan room table dengan data sensor
4. Klik refresh untuk update data

**Explain:**
- Data dari container `sensors_readings`
- Real-time monitoring untuk decision making
- Bisa track usage pattern per jam/hari

---

### 7. **Logs Page** (Admin Only - http://localhost:3000/logs)

**Highlight:**
- ✅ Activity logs dari semua ruangan
- ✅ Filter by type: Entry, Exit, Temp, Motion
- ✅ Filter by room
- ✅ Search functionality
- ✅ Export to CSV
- ✅ Auto-refresh setiap 10 detik

**Demo:**
1. Tunjukkan log feed (entry, exit, temp, motion)
2. Klik filter type (Masuk, Keluar, Suhu, Gerak)
3. Filter by room (dropdown)
4. Search: ketik "suhu" atau "masuk"
5. Klik "Ekspor CSV" untuk download

**Explain:**
- Data dari container `room_status_logs`
- Tracking semua aktivitas sensor
- Useful untuk audit dan troubleshooting

---

## 🎤 TALKING POINTS

### Teknologi Stack:
- **Frontend**: Next.js 16 (React), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Azure Cosmos DB (NoSQL)
- **Real-time**: SWR (polling every 5-10 seconds)
- **Hardware**: ESP32 + DHT22 + PIR + IR sensors

### Key Features:
1. **Real-time Monitoring**: Data sensor update otomatis
2. **Smart Booking**: Validasi jadwal + auto-cancel
3. **Role-based Access**: Admin vs Mahasiswa
4. **Analytics Dashboard**: Insights dari data sensor
5. **Activity Logs**: Tracking semua events
6. **Responsive UI**: Mobile-friendly

### Database Design:
- **7 Containers**: users, rooms, schedules, bookings, sensors_readings, room_status_logs, class_sessions
- **Partition Keys**: Optimized untuk query performance
- **Real-time Sync**: Polling dari frontend ke API routes

### No Dummy Data:
- ✅ Semua data dari Cosmos DB
- ✅ Tidak ada hardcoded data
- ✅ Production-ready

---

## 🐛 TROUBLESHOOTING SAAT DEMO

### Jika Login Gagal:
```bash
# Verify users exist
node seed.mjs
```

### Jika Data Tidak Muncul:
1. Check browser console (F12)
2. Check API response di Network tab
3. Verify Cosmos DB connection:
   ```bash
   node create-containers.mjs
   ```

### Jika Build Error:
```bash
# Clear cache & rebuild
rm -rf .next
npm run build
```

### Jika Server Crash:
```bash
# Restart dev server
npm run dev
```

---

## 📊 DATA YANG SUDAH DI-SEED

### Users:
1. **Admin/Dosen**
   - Email: `dosen@example.com`
   - Password: `password123`
   - NIP: `198501012010121001`

2. **Mahasiswa**
   - Email: `mahasiswa@example.com`
   - Password: `password123`
   - NIM: `2141720001`

### Rooms:
- RT04_5B, RT05_5B, RT06_5B, RT07_5B (Lantai 5)
- LSI1_6T, LSI2_6T (Lantai 6)
- LIG1_7T, LIG2_7T (Lantai 7)

### Schedules:
- Basis Data - Monday 08:00-10:00 @ RT04_5B
- Algoritma dan Struktur Data - Tuesday 10:00-12:00 @ LSI1_6T
- Jaringan Komputer - Wednesday 13:00-15:00 @ LIG2_7T

---

## ✅ FINAL CHECKLIST

Sebelum presentasi, pastikan:

- [ ] Server running (`npm run dev`)
- [ ] Database connected (test login)
- [ ] Browser ready (Chrome/Edge recommended)
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Close unnecessary tabs
- [ ] Zoom/screen share ready
- [ ] Backup: Screenshot key features

---

## 🎉 GOOD LUCK!

Website sudah **100% siap** untuk presentasi. Semua fitur berfungsi dengan baik, tidak ada error, dan semua data dari Cosmos DB.

**Tips:**
- Speak confidently
- Highlight real-time features
- Explain the problem you're solving
- Show the technical architecture
- Demo the key workflows

**You got this! 🚀**

---

**Prepared by**: Kiro AI Assistant  
**Date**: 13 Mei 2026  
**Status**: ✅ READY FOR PRESENTATION
