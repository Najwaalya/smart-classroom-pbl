# 📅 Fitur Kelola Jadwal - Admin

## 🎯 Tujuan

Memberikan kemampuan kepada admin untuk menambah, melihat, dan menghapus jadwal perkuliahan. Fitur ini penting karena jadwal berubah setiap 6 bulan (naik semester).

## ✨ Fitur Utama

### 1. **Tambah Jadwal Baru**
- Form lengkap untuk input jadwal
- Field: Ruangan, Hari, Waktu Mulai, Waktu Selesai, Mata Kuliah (opsional), Dosen (opsional)
- Validasi input
- Simpan ke localStorage (bisa diganti dengan database)

### 2. **Lihat Semua Jadwal**
- Tabel lengkap dengan semua jadwal
- Menampilkan jadwal default + jadwal custom
- Badge untuk membedakan tipe jadwal (Default vs Custom)

### 3. **Hapus Jadwal Custom**
- Hanya jadwal custom yang bisa dihapus
- Jadwal default tidak bisa dihapus (proteksi)
- Konfirmasi sebelum menghapus

### 4. **Filter & Search**
- Search berdasarkan: ruangan, mata kuliah, dosen
- Filter berdasarkan hari
- Real-time filtering

### 5. **Statistik**
- Total jadwal
- Jumlah jadwal custom
- Jumlah jadwal default

## 📁 File yang Dibuat

### 1. **`src/app/(dashboard)/manage-schedule/page.tsx`**
Halaman utama untuk kelola jadwal.

**Fitur:**
- ✅ Form tambah jadwal
- ✅ Tabel jadwal
- ✅ Search & filter
- ✅ Statistik
- ✅ Delete jadwal custom
- ✅ Auth check (hanya admin)

### 2. **`src/lib/schedule-loader.ts`**
Utility untuk load jadwal dari default + localStorage.

**Functions:**
- `getAllSchedules()` - Get semua jadwal (default + custom)
- `getSchedulesForRoom(room, day)` - Get jadwal untuk ruangan tertentu
- `hasScheduleConflict(room, day, start, end)` - Check bentrok jadwal

## 📝 File yang Dimodifikasi

### 1. **`src/components/layout/Sidebar.tsx`**
Tambah menu "Kelola Jadwal" untuk admin.

**Perubahan:**
```typescript
...(role === "admin"
  ? [
      { name: "Kelola Jadwal", href: "/manage-schedule", icon: Settings },
      { name: "Analitik", href: "/analytics", icon: LineChart },
      { name: "Riwayat", href: "/logs", icon: History },
    ]
  : []),
```

### 2. **`src/app/(dashboard)/schedule/page.tsx`**
Update untuk menggunakan `getAllSchedules()` dari schedule-loader.

**Perubahan:**
- Import `getAllSchedules` dari `schedule-loader`
- Load schedules di useEffect
- Jadwal akan otomatis update ketika ada perubahan

## 🎨 UI/UX

### **Header**
```
┌─────────────────────────────────────────────────────┐
│ Kelola Jadwal Perkuliahan        [+ Tambah Jadwal] │
│ Tambah, edit, atau hapus jadwal kelas untuk        │
│ semester baru                                       │
└─────────────────────────────────────────────────────┘
```

### **Info Box**
```
┌─────────────────────────────────────────────────────┐
│ 💡 Info: Jadwal yang ditambahkan akan tersimpan    │
│ dan digunakan untuk semester berjalan. Setiap 6    │
│ bulan atau naik semester, Anda dapat menambahkan   │
│ jadwal baru atau menghapus jadwal lama.            │
└─────────────────────────────────────────────────────┘
```

### **Form Tambah Jadwal**
```
┌─────────────────────────────────────────────────────┐
│ Tambah Jadwal Baru                                  │
├─────────────────────────────────────────────────────┤
│ Ruangan *        [RT04_5B          ]                │
│ Hari *           [Senin ▼          ]                │
│ Waktu Mulai *    [07:30            ]                │
│ Waktu Selesai *  [10:10            ]                │
│ Mata Kuliah      [Pemrograman Web  ]                │
│ Dosen            [Dr. Budi Santoso ]                │
│                                                     │
│ [Batal]                    [Simpan Jadwal]         │
└─────────────────────────────────────────────────────┘
```

### **Statistik**
```
┌──────────────┬──────────────┬──────────────┐
│ Total Jadwal │ Jadwal Custom│ Jadwal Default│
│     85       │      5       │      80       │
└──────────────┴──────────────┴──────────────┘
```

### **Tabel Jadwal**
```
┌────────┬────────┬──────────┬──────────────┬────────────┬────────┬──────┐
│ Ruangan│ Hari   │ Waktu    │ Mata Kuliah  │ Dosen      │ Tipe   │ Aksi │
├────────┼────────┼──────────┼──────────────┼────────────┼────────┼──────┤
│ RT04_5B│ Senin  │ 07:30-   │ Pemrograman  │ Dr. Budi   │ Custom │ 🗑️   │
│        │        │ 10:10    │ Web          │ Santoso    │        │      │
├────────┼────────┼──────────┼──────────────┼────────────┼────────┼──────┤
│ RT01_5B│ Senin  │ 07:30-   │ -            │ -          │ Default│  -   │
│        │        │ 10:10    │              │            │        │      │
└────────┴────────┴──────────┴──────────────┴────────────┴────────┴──────┘
```

## 🔄 Alur Penggunaan

### **Menambah Jadwal Baru**
```
1. Login sebagai admin
   ↓
2. Klik menu "Kelola Jadwal"
   ↓
3. Klik tombol "Tambah Jadwal"
   ↓
4. Isi form:
   - Ruangan: RT04_5B
   - Hari: Senin
   - Waktu Mulai: 07:30
   - Waktu Selesai: 10:10
   - Mata Kuliah: Pemrograman Web (opsional)
   - Dosen: Dr. Budi Santoso (opsional)
   ↓
5. Klik "Simpan Jadwal"
   ↓
6. Jadwal tersimpan dan muncul di tabel
   ↓
7. Jadwal otomatis muncul di halaman "Jadwal & Monitoring"
```

### **Menghapus Jadwal Custom**
```
1. Buka halaman "Kelola Jadwal"
   ↓
2. Cari jadwal yang ingin dihapus (tipe: Custom)
   ↓
3. Klik icon 🗑️ (Trash) di kolom Aksi
   ↓
4. Konfirmasi: "Yakin ingin menghapus jadwal ini?"
   ↓
5. Klik "OK"
   ↓
6. Jadwal terhapus dari tabel
   ↓
7. Jadwal otomatis hilang dari halaman "Jadwal & Monitoring"
```

### **Search & Filter**
```
1. Buka halaman "Kelola Jadwal"
   ↓
2. Gunakan search box:
   - Ketik "RT04" → Filter ruangan RT04_5B
   - Ketik "Pemrograman" → Filter mata kuliah
   - Ketik "Budi" → Filter dosen
   ↓
3. Gunakan filter hari:
   - Pilih "Senin" → Hanya jadwal Senin
   - Pilih "Semua Hari" → Semua jadwal
```

## 💾 Data Storage

### **localStorage Structure**
```json
{
  "customSchedules": [
    {
      "id": "custom-1234567890",
      "room": "RT04_5B",
      "day": "Monday",
      "start": "07:30",
      "end": "10:10",
      "subject": "Pemrograman Web",
      "lecturer": "Dr. Budi Santoso"
    }
  ]
}
```

### **Cara Kerja:**
1. **Default Schedules** → Dari `src/lib/schedule.ts` (hardcoded)
2. **Custom Schedules** → Dari `localStorage` (user input)
3. **Combined** → Default + Custom = Semua jadwal yang ditampilkan

### **Keuntungan:**
- ✅ Jadwal default tidak bisa dihapus (proteksi)
- ✅ Jadwal custom bisa ditambah/hapus kapan saja
- ✅ Data persisten (tidak hilang saat refresh)
- ✅ Mudah di-migrate ke database (tinggal ganti localStorage dengan API call)

## 🔄 Migrasi ke Database (Future)

### **Langkah-langkah:**

#### 1. **Buat Tabel Database**
```sql
CREATE TABLE schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room VARCHAR(50) NOT NULL,
  day VARCHAR(20) NOT NULL,
  start TIME NOT NULL,
  end TIME NOT NULL,
  subject VARCHAR(100),
  lecturer VARCHAR(100),
  type ENUM('default', 'custom') DEFAULT 'custom',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. **Buat API Endpoints**
```typescript
// GET /api/schedules - Get all schedules
// POST /api/schedules - Add new schedule
// DELETE /api/schedules/:id - Delete schedule
```

#### 3. **Update schedule-loader.ts**
```typescript
export async function getAllSchedules(): Promise<Schedule[]> {
  const response = await fetch("/api/schedules");
  const data = await response.json();
  return data;
}
```

#### 4. **Update manage-schedule page**
```typescript
// Replace localStorage with API calls
const handleAddSchedule = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const response = await fetch("/api/schedules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  
  if (response.ok) {
    // Reload schedules
    loadSchedules();
  }
};
```

## 🎯 Use Cases

### **Use Case 1: Semester Baru (Ganti Jadwal)**
```
Scenario: Semester baru dimulai, jadwal berubah total

1. Admin login
2. Buka "Kelola Jadwal"
3. Hapus semua jadwal custom semester lalu
4. Tambah jadwal baru untuk semester ini
5. Jadwal otomatis update di semua halaman
```

### **Use Case 2: Tambah Kelas Baru**
```
Scenario: Ada kelas baru di tengah semester

1. Admin login
2. Buka "Kelola Jadwal"
3. Klik "Tambah Jadwal"
4. Isi data kelas baru
5. Simpan
6. Kelas baru langsung muncul di jadwal
```

### **Use Case 3: Kelas Dibatalkan**
```
Scenario: Kelas dibatalkan karena dosen sakit

1. Admin login
2. Buka "Kelola Jadwal"
3. Cari jadwal kelas yang dibatalkan
4. Klik icon hapus
5. Konfirmasi
6. Jadwal terhapus, slot jadi kosong (hijau)
```

## 📊 Statistik & Monitoring

### **Metrics yang Ditampilkan:**
- **Total Jadwal**: Jumlah semua jadwal (default + custom)
- **Jadwal Custom**: Jumlah jadwal yang ditambahkan admin
- **Jadwal Default**: Jumlah jadwal bawaan sistem

### **Insight:**
- Jika jadwal custom banyak → Admin aktif mengelola jadwal
- Jika jadwal custom sedikit → Masih menggunakan jadwal default
- Perbandingan membantu admin memahami seberapa banyak perubahan yang dilakukan

## 🔒 Security & Validation

### **Auth Check:**
```typescript
useEffect(() => {
  const role = getRole();
  if (role !== "admin") {
    router.replace("/"); // Redirect non-admin
  }
}, [router]);
```

### **Input Validation:**
- ✅ Ruangan: Required, text input
- ✅ Hari: Required, dropdown (Monday-Friday)
- ✅ Waktu Mulai: Required, time input
- ✅ Waktu Selesai: Required, time input
- ✅ Mata Kuliah: Optional, text input
- ✅ Dosen: Optional, text input

### **Delete Protection:**
```typescript
if (id.startsWith("default-")) {
  alert("Tidak bisa menghapus jadwal default.");
  return;
}
```

## 🧪 Testing Checklist

### **Test 1: Tambah Jadwal**
- [ ] Login sebagai admin
- [ ] Buka halaman "Kelola Jadwal"
- [ ] Klik "Tambah Jadwal"
- [ ] Isi semua field required
- [ ] Klik "Simpan Jadwal"
- [ ] Jadwal muncul di tabel
- [ ] Jadwal muncul di halaman "Jadwal & Monitoring"

### **Test 2: Hapus Jadwal Custom**
- [ ] Buka halaman "Kelola Jadwal"
- [ ] Cari jadwal custom (badge hijau)
- [ ] Klik icon hapus
- [ ] Konfirmasi
- [ ] Jadwal terhapus dari tabel
- [ ] Jadwal hilang dari halaman "Jadwal & Monitoring"

### **Test 3: Proteksi Jadwal Default**
- [ ] Buka halaman "Kelola Jadwal"
- [ ] Cari jadwal default (badge ungu)
- [ ] Tidak ada icon hapus (hanya "-")
- [ ] Jadwal default tidak bisa dihapus

### **Test 4: Search**
- [ ] Ketik nama ruangan di search box
- [ ] Tabel filter sesuai ruangan
- [ ] Ketik mata kuliah
- [ ] Tabel filter sesuai mata kuliah
- [ ] Clear search
- [ ] Semua jadwal muncul kembali

### **Test 5: Filter Hari**
- [ ] Pilih "Senin" di dropdown
- [ ] Hanya jadwal Senin yang muncul
- [ ] Pilih "Selasa"
- [ ] Hanya jadwal Selasa yang muncul
- [ ] Pilih "Semua Hari"
- [ ] Semua jadwal muncul

### **Test 6: Persistence**
- [ ] Tambah jadwal baru
- [ ] Refresh halaman
- [ ] Jadwal masih ada (tersimpan di localStorage)
- [ ] Buka halaman "Jadwal & Monitoring"
- [ ] Jadwal muncul di grid

### **Test 7: Auth Protection**
- [ ] Logout
- [ ] Login sebagai mahasiswa
- [ ] Tidak ada menu "Kelola Jadwal" di sidebar
- [ ] Akses langsung `/manage-schedule`
- [ ] Redirect ke dashboard (tidak bisa akses)

## 📚 Resources

- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [React Forms](https://react.dev/reference/react-dom/components/form)

---

**Tanggal:** 11 Mei 2026  
**Developer:** Kiro AI Assistant  
**Version:** 1.0.0  
**Status:** ✅ Completed
