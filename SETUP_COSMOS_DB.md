# 🚀 Setup Cosmos DB - Panduan Lengkap

## ⚠️ PENTING: Containers Belum Dibuat!

Error "Owner resource does not exist" berarti containers belum dibuat di Azure Cosmos DB Anda.

---

## 📋 Langkah-langkah Setup

### 1. Buka Azure Portal

1. Buka https://portal.azure.com
2. Login dengan akun Azure Anda
3. Cari "Cosmos DB" di search bar
4. Klik account Cosmos DB Anda: **cosmosdb-smartclass**

### 2. Buat Containers

Anda perlu membuat 7 containers berikut:

#### Container 1: `users`
- **Container ID:** `users`
- **Partition key:** `/id`
- **Throughput:** 400 RU/s (Manual) atau Autoscale

#### Container 2: `rooms`
- **Container ID:** `rooms`
- **Partition key:** `/id`
- **Throughput:** 400 RU/s (Manual) atau Autoscale

#### Container 3: `schedules`
- **Container ID:** `schedules`
- **Partition key:** `/id`
- **Throughput:** 400 RU/s (Manual) atau Autoscale

#### Container 4: `bookings`
- **Container ID:** `bookings`
- **Partition key:** `/id`
- **Throughput:** 400 RU/s (Manual) atau Autoscale

#### Container 5: `class_sessions`
- **Container ID:** `class_sessions`
- **Partition key:** `/id`
- **Throughput:** 400 RU/s (Manual) atau Autoscale

#### Container 6: `sensors_readings`
- **Container ID:** `sensors_readings`
- **Partition key:** `/roomId`
- **Throughput:** 400 RU/s (Manual) atau Autoscale

#### Container 7: `room_status_logs`
- **Container ID:** `room_status_logs`
- **Partition key:** `/roomId`
- **Throughput:** 400 RU/s (Manual) atau Autoscale

---

## 🎯 Cara Membuat Container di Azure Portal

### Langkah Detail:

1. **Buka Cosmos DB Account:**
   - Azure Portal → Cosmos DB → **cosmosdb-smartclass**

2. **Klik "Data Explorer"** di menu kiri

3. **Klik "New Container"**

4. **Isi Form:**
   - **Database id:** Pilih "Use existing" → `smartclassroomdb`
   - **Container id:** Masukkan nama container (e.g., `users`)
   - **Partition key:** Masukkan partition key (e.g., `/id`)
   - **Throughput:** Pilih "Manual" → 400 RU/s (atau Autoscale jika ingin)

5. **Klik "OK"**

6. **Ulangi** untuk semua 7 containers

---

## 🔄 Setelah Containers Dibuat

### 1. Jalankan Seed Script

```bash
node seed.mjs
```

**Output yang diharapkan:**
```
🚀 Starting seed process...

📍 Endpoint: https://cosmosdb-smartclass.documents.azure.com:443/
📦 Database: smartclassroomdb

🌱 Seeding users...
✅ Created/Updated user: Dr. Budi Santoso, M.T.
✅ Created/Updated user: Moch. A.B.A

🌱 Seeding rooms...
✅ Created/Updated room: TI-1A
✅ Created/Updated room: TI-1B
✅ Created/Updated room: TI-2A
✅ Created/Updated room: TI-2B

🌱 Seeding schedules...
✅ Created/Updated schedule: Pemrograman Web - Monday
✅ Created/Updated schedule: Basis Data - Monday
✅ Created/Updated schedule: Algoritma dan Struktur Data - Tuesday
✅ Created/Updated schedule: Jaringan Komputer - Wednesday

✅ Seed process completed successfully!
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test Aplikasi

1. **Buka:** http://localhost:3000/login

2. **Login sebagai Dosen:**
   - Email: `dosen@gmail.com`
   - Password: `197805122005011002`

3. **Login sebagai Mahasiswa:**
   - NIM: `2341720024`
   - Password: `2341720024`

4. **Verifikasi:**
   - Dashboard menampilkan data ruangan dari Cosmos DB
   - Schedule menampilkan jadwal dari Cosmos DB
   - Booking bisa create/read dari Cosmos DB

---

## 📊 Struktur Data yang Di-seed

### Users (2 users)
1. **Dosen:**
   - ID: `197805122005011002`
   - Email: `dosen@gmail.com`
   - Role: `admin`
   - Name: Dr. Budi Santoso, M.T.

2. **Mahasiswa:**
   - ID: `2341720024`
   - NIM: `2341720024`
   - Role: `mahasiswa`
   - Name: Moch. A.B.A

### Rooms (4 rooms)
- TI-1A (Gedung TI, Capacity: 40)
- TI-1B (Gedung TI, Capacity: 40)
- TI-2A (Gedung TI, Capacity: 40)
- TI-2B (Gedung TI, Capacity: 40)

### Schedules (4 schedules)
1. **Pemrograman Web** - Monday 07:00-09:30 (TI-1A)
2. **Basis Data** - Monday 10:00-12:30 (TI-1A)
3. **Algoritma dan Struktur Data** - Tuesday 07:00-09:30 (TI-1B)
4. **Jaringan Komputer** - Wednesday 13:00-15:30 (TI-2A)

---

## 🔍 Verifikasi di Azure Portal

### Cara Cek Data di Data Explorer:

1. **Buka Data Explorer** di Cosmos DB Account
2. **Expand database** `smartclassroomdb`
3. **Expand container** (e.g., `users`)
4. **Klik "Items"**
5. **Lihat data** yang sudah di-seed

---

## 🛠️ Troubleshooting

### Error: "Owner resource does not exist"
**Solusi:** Containers belum dibuat. Ikuti langkah di atas untuk membuat containers.

### Error: "Request rate is large"
**Solusi:** Terlalu banyak request. Tunggu beberapa detik dan coba lagi, atau upgrade RU/s.

### Error: "Unauthorized"
**Solusi:** Cek `COSMOS_KEY` di `.env.local` apakah benar.

### Error: "Invalid URL"
**Solusi:** Cek `COSMOS_ENDPOINT` di `.env.local` apakah benar.

### Data tidak muncul di aplikasi
**Solusi:**
1. Cek Console browser (F12) untuk error
2. Cek Network tab untuk melihat API response
3. Restart development server
4. Clear browser cache

---

## ✅ Checklist Setup

- [ ] Buka Azure Portal
- [ ] Buat container `users` dengan partition key `/id`
- [ ] Buat container `rooms` dengan partition key `/id`
- [ ] Buat container `schedules` dengan partition key `/id`
- [ ] Buat container `bookings` dengan partition key `/id`
- [ ] Buat container `class_sessions` dengan partition key `/id`
- [ ] Buat container `sensors_readings` dengan partition key `/roomId`
- [ ] Buat container `room_status_logs` dengan partition key `/roomId`
- [ ] Jalankan `node seed.mjs`
- [ ] Verifikasi data di Data Explorer
- [ ] Start development server `npm run dev`
- [ ] Test login dosen
- [ ] Test login mahasiswa
- [ ] Test dashboard
- [ ] Test schedule
- [ ] Test booking

---

## 📞 Next Steps

1. **Buat containers** di Azure Portal (langkah paling penting!)
2. **Jalankan seed script** untuk mengisi data awal
3. **Test aplikasi** untuk memastikan semua berfungsi
4. **Hubungkan ESP32** untuk mengirim data sensor ke Cosmos DB

---

## 🎉 Setelah Setup Selesai

Aplikasi Anda akan:
- ✅ Terhubung dengan Cosmos DB
- ✅ Login menggunakan data dari Cosmos DB
- ✅ Dashboard menampilkan data real-time dari Cosmos DB
- ✅ Schedule management untuk admin
- ✅ Booking system untuk mahasiswa
- ✅ Analytics dari data sensor
- ✅ Logs dari aktivitas ruangan

**Status:** ⏳ Menunggu containers dibuat di Azure Portal
