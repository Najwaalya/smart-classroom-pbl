# 🔧 Cara Testing Perbaikan Role Display

## ⚠️ PENTING: Langkah-langkah yang HARUS dilakukan

### 1. **Buka Browser di Port yang Benar**
Server sekarang berjalan di: **http://localhost:3001** (bukan 3000)

### 2. **Hard Refresh Browser** (WAJIB!)
Pilih salah satu cara:

**Windows/Linux:**
- `Ctrl + Shift + R` (Chrome/Firefox/Edge)
- `Ctrl + F5`
- Atau buka DevTools (F12) → klik kanan tombol refresh → pilih "Empty Cache and Hard Reload"

**Mac:**
- `Cmd + Shift + R`
- `Cmd + Option + R`

### 3. **Clear Browser Cache** (Jika masih tidak berubah)
1. Buka DevTools (F12)
2. Klik tab "Application" (Chrome) atau "Storage" (Firefox)
3. Klik "Clear site data" atau "Clear storage"
4. Refresh halaman

### 4. **Clear localStorage** (Jika masih tidak berubah)
1. Buka DevTools (F12)
2. Buka Console
3. Ketik: `localStorage.clear()`
4. Tekan Enter
5. Refresh halaman
6. Login ulang

---

## 🧪 Testing Login Dosen

1. Buka: **http://localhost:3001/login**
2. Masukkan:
   - Email: `dosen@gmail.com`
   - Password: `197805122005011002`
3. Klik Login

### ✅ Yang Harus Terlihat:
- Badge di Topbar: **"DOSEN"** (warna biru)
- ID di Topbar: **"NIP: 197805122005011002"**
- Menu Sidebar:
  - Dashboard
  - Jadwal & Monitoring
  - **Kelola Jadwal** ← Menu admin
  - **Analitik** ← Menu admin
  - **Riwayat** ← Menu admin

---

## 🧪 Testing Login Mahasiswa

1. Logout dulu (klik avatar → Keluar)
2. Login dengan:
   - NIM: `2341720024`
   - Password: `2341720024`

### ✅ Yang Harus Terlihat:
- Badge di Topbar: **"MAHASISWA"** (warna hijau)
- ID di Topbar: **"NIM: 2341720024"**
- Menu Sidebar:
  - Dashboard
  - Jadwal & Monitoring
  - **Booking Ruangan** ← Menu mahasiswa

---

## 🐛 Jika Masih Tidak Berubah

### Cek 1: Apakah Server Berjalan?
```bash
# Cek di terminal, harus ada tulisan:
✓ Ready in XXXXms
Local: http://localhost:3001
```

### Cek 2: Apakah Ada Error di Console?
1. Buka DevTools (F12)
2. Lihat tab Console
3. Jika ada error merah, screenshot dan kirim ke saya

### Cek 3: Apakah File Sudah Benar?
Buka file: `src/components/layout/Topbar.tsx`
Cari baris sekitar 295-298, harus seperti ini:
```typescript
{userInfo?.role === "admin"
  ? "DOSEN"
  : "MAHASISWA"}
```

### Cek 4: Restart Server
1. Stop server (Ctrl+C di terminal)
2. Hapus cache: `rm -rf .next` atau `Remove-Item -Recurse -Force .next`
3. Jalankan lagi: `npm run dev`
4. Hard refresh browser

---

## 📸 Screenshot untuk Verifikasi

Jika masih tidak berubah, kirim screenshot:
1. **Topbar** - bagian kanan atas (avatar + badge)
2. **Sidebar** - menu yang muncul
3. **Console** - tab Console di DevTools (F12)
4. **Network** - tab Network di DevTools, filter "localhost:3001"

---

## 🔍 Debug Mode

Jika ingin cek manual, buka Console (F12) dan ketik:
```javascript
// Cek role yang tersimpan
localStorage.getItem('role')

// Cek semua data user
console.log({
  role: localStorage.getItem('role'),
  userName: localStorage.getItem('userName'),
  userId: localStorage.getItem('userId')
})
```

**Hasil yang benar untuk Dosen:**
```
role: "admin"
userName: "Dr. Budi Santoso, M.T."
userId: "197805122005011002"
```

**Hasil yang benar untuk Mahasiswa:**
```
role: "mahasiswa"
userName: "Moch. A.B.A"
userId: "2341720024"
```

---

## ✅ Checklist Testing

- [ ] Server berjalan di http://localhost:3001
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Clear localStorage
- [ ] Login sebagai dosen
- [ ] Badge menampilkan "DOSEN"
- [ ] ID menampilkan "NIP: 197805122005011002"
- [ ] Menu admin muncul (Kelola Jadwal, Analitik, Riwayat)
- [ ] Logout
- [ ] Login sebagai mahasiswa
- [ ] Badge menampilkan "MAHASISWA"
- [ ] ID menampilkan "NIM: 2341720024"
- [ ] Menu mahasiswa muncul (Booking Ruangan)
- [ ] Tidak ada hydration error di console

---

## 🆘 Masih Bermasalah?

Jika setelah semua langkah di atas masih tidak berubah:
1. Screenshot Topbar (bagian kanan atas)
2. Screenshot Console (F12 → Console tab)
3. Screenshot file `src/components/layout/Topbar.tsx` baris 290-300
4. Kirim ke saya untuk analisis lebih lanjut
