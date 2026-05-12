# 🔗 Integrasi Cosmos DB - Smart Classroom

## 📋 Daftar Isi
1. [Konfigurasi](#konfigurasi)
2. [Struktur Database](#struktur-database)
3. [Services](#services)
4. [API Routes](#api-routes)
5. [Seed Data](#seed-data)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Konfigurasi

### 1. Environment Variables (`.env.local`)

File `.env.local` sudah dikonfigurasi dengan:

```env
COSMOS_ENDPOINT=https://cosmosdb-smartclass.documents.azure.com:443/
COSMOS_KEY=<YOUR_COSMOS_KEY>
COSMOS_DATABASE=smartclassroomdb
```

### 2. Cosmos DB Client (`src/lib/cosmos.ts`)

Sudah dikonfigurasi dengan containers:
- ✅ `users` - Data pengguna (mahasiswa & dosen)
- ✅ `rooms` - Data ruangan
- ✅ `schedules` - Jadwal kuliah
- ✅ `bookings` - Booking ruangan
- ✅ `class_sessions` - Sesi kelas
- ✅ `sensors_readings` - Data sensor (suhu, kelembaban, PIR, IR)
- ✅ `room_status_logs` - Log status ruangan

---

## 📊 Struktur Database

### Container: `users`
```typescript
{
  id: string;              // NIM atau NIP
  email?: string;          // Email (untuk admin/dosen)
  nim?: string;            // NIM (untuk mahasiswa)
  nip?: string;            // NIP (untuk dosen)
  password: string;        // Password
  role: "admin" | "mahasiswa";
  name: string;            // Nama lengkap
  createdAt: string;       // ISO timestamp
  updatedAt?: string;      // ISO timestamp
}
```

### Container: `rooms`
```typescript
{
  id: string;              // ID ruangan (e.g., "TI-1A")
  name: string;            // Nama ruangan
  wing?: string;           // Gedung/Wing
  capacity: number;        // Kapasitas mahasiswa
  status: "active" | "uncertain" | "empty";
  lastUpdate?: string;     // ISO timestamp
  createdAt: string;
}
```

### Container: `schedules`
```typescript
{
  id: string;              // Unique ID
  roomId: string;          // ID ruangan
  day: string;             // Hari (Monday, Tuesday, ...)
  startTime: string;       // Jam mulai (HH:mm)
  endTime: string;         // Jam selesai (HH:mm)
  subject: string;         // Mata kuliah
  lecturer: string;        // Nama dosen
  class: string;           // Kelas (e.g., "TI-2A")
  semester: string;        // Semester (Ganjil/Genap)
  academicYear: string;    // Tahun ajaran (e.g., "2025/2026")
  createdAt: string;
  updatedAt?: string;
}
```

### Container: `bookings`
```typescript
{
  id: string;              // Unique ID
  roomId: string;          // ID ruangan
  userId: string;          // NIM mahasiswa
  userName: string;        // Nama mahasiswa
  userNim: string;         // NIM mahasiswa
  date: string;            // Tanggal (YYYY-MM-DD)
  startTime: string;       // Jam mulai (HH:mm)
  endTime: string;         // Jam selesai (HH:mm)
  purpose: string;         // Tujuan booking
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  createdAt: string;
  updatedAt?: string;
  approvedBy?: string;     // NIP dosen yang approve
  approvedAt?: string;
  rejectedReason?: string;
}
```

### Container: `sensors_readings`
```typescript
{
  id: string;              // Unique ID
  roomId: string;          // ID ruangan
  temperature: number;     // Suhu (°C)
  humidity: number;        // Kelembaban (%)
  pirStatus: boolean;      // Status PIR sensor
  irCount: number;         // Jumlah orang dari IR sensor
  timestamp: string;       // ISO timestamp
}
```

### Container: `room_status_logs`
```typescript
{
  id: string;              // Unique ID
  roomId: string;          // ID ruangan
  status: string;          // Status ruangan
  students: number;        // Jumlah mahasiswa
  temperature: number;     // Suhu
  humidity: number;        // Kelembaban
  timestamp: string;       // ISO timestamp
}
```

---

## 🛠️ Services

### 1. Auth Service (`src/lib/services/auth.service.ts`)

**Functions:**
- `loginUser(identifier, password)` - Login dengan email/NIM
- `getUserById(userId)` - Get user by ID
- `changePassword(userId, oldPassword, newPassword)` - Ubah password
- `seedDefaultUsers()` - Seed default users

**Usage:**
```typescript
import { loginUser } from "@/lib/services/auth.service";

const result = await loginUser("dosen@gmail.com", "197805122005011002");
if (result.success) {
  console.log("Login berhasil:", result.user);
}
```

### 2. Room Service (`src/lib/services/room.service.ts`)

**Functions:**
- `getAllRooms()` - Get semua ruangan dengan data sensor terbaru
- `getRoomById(roomId)` - Get ruangan by ID
- `getLatestSensorReading(roomId)` - Get sensor reading terbaru
- `getSensorReadings(roomId, startTime, endTime, limit)` - Get sensor readings
- `getRoomStatusLogs(roomId, limit)` - Get status logs
- `updateRoomStatus(roomId, status)` - Update status ruangan

**Usage:**
```typescript
import { getAllRooms } from "@/lib/services/room.service";

const rooms = await getAllRooms();
console.log("Rooms:", rooms);
```

### 3. Schedule Service (`src/lib/services/schedule.service.ts`)

**Functions:**
- `getAllSchedules()` - Get semua jadwal
- `getSchedulesByRoom(roomId)` - Get jadwal by ruangan
- `getSchedulesByDay(day)` - Get jadwal by hari
- `createSchedule(schedule)` - Buat jadwal baru
- `updateSchedule(scheduleId, updates)` - Update jadwal
- `deleteSchedule(scheduleId)` - Hapus jadwal
- `getClassSessions(roomId, date)` - Get sesi kelas
- `createClassSession(session)` - Buat sesi kelas
- `updateClassSession(sessionId, updates)` - Update sesi kelas

**Usage:**
```typescript
import { createSchedule } from "@/lib/services/schedule.service";

const result = await createSchedule({
  roomId: "TI-1A",
  day: "Monday",
  startTime: "07:00",
  endTime: "09:30",
  subject: "Pemrograman Web",
  lecturer: "Dr. Budi Santoso, M.T.",
  class: "TI-2A",
  semester: "Ganjil",
  academicYear: "2025/2026",
});
```

### 4. Booking Service (`src/lib/services/booking.service.ts`)

**Functions:**
- `getAllBookings()` - Get semua booking
- `getBookingsByUser(userId)` - Get booking by user
- `getBookingsByRoom(roomId)` - Get booking by ruangan
- `getBookingsByDate(date)` - Get booking by tanggal
- `createBooking(booking)` - Buat booking baru
- `checkBookingConflict(roomId, date, startTime, endTime)` - Cek konflik booking
- `updateBookingStatus(bookingId, status, approvedBy, rejectedReason)` - Update status
- `cancelBooking(bookingId)` - Cancel booking
- `deleteBooking(bookingId)` - Hapus booking

**Usage:**
```typescript
import { createBooking } from "@/lib/services/booking.service";

const result = await createBooking({
  roomId: "TI-1A",
  userId: "2341720024",
  userName: "Moch. A.B.A",
  userNim: "2341720024",
  date: "2026-05-15",
  startTime: "13:00",
  endTime: "15:00",
  purpose: "Rapat Organisasi",
});
```

---

## 🌐 API Routes

### 1. Auth API

**POST `/api/auth/login`**
```typescript
// Request
{
  identifier: "dosen@gmail.com",
  password: "197805122005011002"
}

// Response
{
  success: true,
  user: {
    id: "197805122005011002",
    name: "Dr. Budi Santoso, M.T.",
    role: "admin",
    email: "dosen@gmail.com",
    nip: "197805122005011002"
  }
}
```

### 2. Rooms API

**GET `/api/rooms`**
```typescript
// Response
{
  success: true,
  rooms: [
    {
      id: "TI-1A",
      name: "TI-1A",
      wing: "Gedung TI",
      capacity: 40,
      status: "active",
      students: 25,
      temp: 26.5,
      humidity: 65.2,
      lastUpdate: "2026-05-12T10:30:00Z"
    }
  ]
}
```

**GET `/api/rooms/[id]`**
```typescript
// Response
{
  success: true,
  room: { ... }
}
```

### 3. Schedules API

**GET `/api/schedules`**
- Query params: `roomId`, `day`

**POST `/api/schedules`**
```typescript
// Request
{
  roomId: "TI-1A",
  day: "Monday",
  startTime: "07:00",
  endTime: "09:30",
  subject: "Pemrograman Web",
  lecturer: "Dr. Budi Santoso, M.T.",
  class: "TI-2A",
  semester: "Ganjil",
  academicYear: "2025/2026"
}
```

**DELETE `/api/schedules?id=<scheduleId>`**

### 4. Bookings API

**GET `/api/bookings`**
- Query params: `userId`, `roomId`

**POST `/api/bookings`**
```typescript
// Request
{
  roomId: "TI-1A",
  userId: "2341720024",
  userName: "Moch. A.B.A",
  userNim: "2341720024",
  date: "2026-05-15",
  startTime: "13:00",
  endTime: "15:00",
  purpose: "Rapat Organisasi"
}
```

**PATCH `/api/bookings`**
```typescript
// Request
{
  bookingId: "...",
  status: "approved",
  approvedBy: "197805122005011002"
}
```

**DELETE `/api/bookings?id=<bookingId>`**

### 5. Logs API

**GET `/api/logs`**
- Query params: `roomId`, `limit`

### 6. Analytics API

**GET `/api/analytics`**
```typescript
// Response
{
  sensors: [...],
  hourly: [...],
  weekly: [...]
}
```

---

## 🌱 Seed Data

### Jalankan Seed Script

```bash
# Install tsx jika belum
npm install -D tsx

# Jalankan seed script
npx tsx src/lib/seed-data.ts
```

### Data yang Di-seed:

**Users:**
- Dosen: `dosen@gmail.com` / `197805122005011002`
- Mahasiswa: `2341720024` / `2341720024`

**Rooms:**
- TI-1A, TI-1B, TI-2A, TI-2B

**Schedules:**
- 4 jadwal contoh untuk berbagai hari dan ruangan

---

## 🧪 Testing

### 1. Test Login API

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"dosen@gmail.com","password":"197805122005011002"}'
```

### 2. Test Rooms API

```bash
curl http://localhost:3000/api/rooms
```

### 3. Test Schedules API

```bash
curl http://localhost:3000/api/schedules
```

### 4. Test Bookings API

```bash
curl http://localhost:3000/api/bookings
```

---

## 🔍 Troubleshooting

### Error: "Failed to fetch"

**Penyebab:** Cosmos DB endpoint atau key salah

**Solusi:**
1. Cek `.env.local`
2. Pastikan `COSMOS_ENDPOINT` dan `COSMOS_KEY` benar
3. Restart development server

### Error: "Container not found"

**Penyebab:** Container belum dibuat di Cosmos DB

**Solusi:**
1. Buka Azure Portal
2. Buka Cosmos DB Account
3. Buat containers sesuai struktur di atas:
   - `users`
   - `rooms`
   - `schedules`
   - `bookings`
   - `class_sessions`
   - `sensors_readings`
   - `room_status_logs`

### Error: "Request rate is large"

**Penyebab:** Terlalu banyak request ke Cosmos DB (throttling)

**Solusi:**
1. Tambahkan delay antar request
2. Gunakan caching
3. Upgrade RU/s di Azure Portal

### Data tidak muncul di frontend

**Solusi:**
1. Cek Console browser (F12) untuk error
2. Cek Network tab untuk melihat API response
3. Pastikan API route sudah benar
4. Restart development server

---

## 📝 Checklist Integrasi

- [x] Konfigurasi `.env.local`
- [x] Setup Cosmos DB client
- [x] Buat service layer (auth, room, schedule, booking)
- [x] Buat API routes
- [x] Buat seed data script
- [ ] Jalankan seed data
- [ ] Test semua API endpoints
- [ ] Update frontend untuk menggunakan API
- [ ] Test login dengan Cosmos DB
- [ ] Test dashboard dengan data real
- [ ] Test booking dengan data real
- [ ] Test schedule management

---

## 🚀 Next Steps

1. **Jalankan seed data:**
   ```bash
   npx tsx src/lib/seed-data.ts
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Test login:**
   - Buka http://localhost:3000/login
   - Login dengan `dosen@gmail.com` / `197805122005011002`

4. **Verifikasi data:**
   - Dashboard harus menampilkan data ruangan dari Cosmos DB
   - Schedule harus menampilkan jadwal dari Cosmos DB
   - Booking harus bisa create/read dari Cosmos DB

---

## 📞 Support

Jika ada masalah, cek:
1. Console browser (F12)
2. Terminal server (error logs)
3. Azure Portal → Cosmos DB → Metrics
4. Azure Portal → Cosmos DB → Data Explorer

**Status:** ✅ Integrasi Cosmos DB siap digunakan!
