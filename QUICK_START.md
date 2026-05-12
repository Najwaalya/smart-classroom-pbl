# 🚀 Quick Start - Smart Classroom dengan Cosmos DB

## ⚡ 3 Langkah Mudah

### 1️⃣ Buat Containers di Azure Portal (5 menit)

1. Buka https://portal.azure.com
2. Cari "Cosmos DB" → Klik **cosmosdb-smartclass**
3. Klik **"Data Explorer"** di menu kiri
4. Klik **"New Container"** 7 kali untuk membuat:

| Container ID | Partition Key |
|--------------|---------------|
| `users` | `/id` |
| `rooms` | `/id` |
| `schedules` | `/id` |
| `bookings` | `/id` |
| `class_sessions` | `/id` |
| `sensors_readings` | `/roomId` |
| `room_status_logs` | `/roomId` |

**Tips:** Gunakan 400 RU/s (Manual) untuk setiap container

---

### 2️⃣ Jalankan Seed Script (1 menit)

```bash
cd smart-classroom-pbl
node seed.mjs
```

**Output yang diharapkan:**
```
✅ Created/Updated user: Dr. Budi Santoso, M.T.
✅ Created/Updated user: Moch. A.B.A
✅ Created/Updated room: TI-1A
✅ Created/Updated room: TI-1B
✅ Created/Updated room: TI-2A
✅ Created/Updated room: TI-2B
✅ Created/Updated schedule: Pemrograman Web - Monday
...
✅ Seed process completed successfully!
```

---

### 3️⃣ Start & Test Aplikasi (2 menit)

```bash
npm run dev
```

Buka http://localhost:3000/login

**Test Login Dosen:**
- Email: `dosen@gmail.com`
- Password: `197805122005011002`

**Test Login Mahasiswa:**
- NIM: `2341720024`
- Password: `2341720024`

---

## ✅ Verifikasi

Setelah login, cek:

### Untuk Dosen:
- [ ] Dashboard menampilkan 4 ruangan (TI-1A, TI-1B, TI-2A, TI-2B)
- [ ] Menu "Kelola Jadwal" muncul di sidebar
- [ ] Menu "Analitik" muncul di sidebar
- [ ] Menu "Riwayat" muncul di sidebar
- [ ] Badge di topbar menampilkan "DOSEN"
- [ ] ID menampilkan "NIP: 197805122005011002"

### Untuk Mahasiswa:
- [ ] Dashboard menampilkan 4 ruangan
- [ ] Menu "Booking Ruangan" muncul di sidebar
- [ ] Badge di topbar menampilkan "MAHASISWA"
- [ ] ID menampilkan "NIM: 2341720024"

---

## 🐛 Troubleshooting

### Error saat seed: "Owner resource does not exist"
**Solusi:** Containers belum dibuat. Kembali ke langkah 1.

### Error saat seed: "Unauthorized"
**Solusi:** Cek `COSMOS_KEY` di `.env.local`

### Dashboard tidak menampilkan data
**Solusi:**
1. Buka Console browser (F12)
2. Cek error di Console tab
3. Cek Network tab untuk melihat API response
4. Restart server: `Ctrl+C` lalu `npm run dev`

### Badge masih menampilkan "MAHASISWA" untuk dosen
**Solusi:**
1. Logout
2. Clear localStorage: Console → `localStorage.clear()`
3. Refresh browser (Ctrl+Shift+R)
4. Login ulang

---

## 📚 Dokumentasi Lengkap

- **Setup Cosmos DB:** `SETUP_COSMOS_DB.md`
- **Integrasi Lengkap:** `COSMOS_DB_INTEGRATION.md`
- **Summary:** `INTEGRASI_COSMOS_DB_SUMMARY.md`

---

## 🎉 Selesai!

Aplikasi Anda sekarang:
- ✅ Terhubung dengan Cosmos DB
- ✅ Login menggunakan data dari database
- ✅ Dashboard menampilkan data real-time
- ✅ Siap untuk development lebih lanjut

**Next:** Hubungkan ESP32 untuk mengirim data sensor! 🚀
