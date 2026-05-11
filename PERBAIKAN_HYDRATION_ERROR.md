# 🔧 Perbaikan Hydration Error - Schedule Page

## 🎯 Masalah

**Error:** `Hydration failed because the server rendered HTML didn't match the client`

**Penyebab:**
- Conditional rendering berdasarkan `role` state yang di-set di `useEffect`
- Server me-render dengan `role = null`, tapi client me-render dengan `role = "mahasiswa"` atau `"admin"`
- Menyebabkan mismatch antara HTML server dan client

## ✅ Solusi

### 1. **Tambah `mounted` State**

```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  setRole(getRole());
  const today = DAYS.find(d => d.key === new Date().toLocaleDateString("en-US", { weekday: "long" }))?.key ?? "Monday";
  setSelectedDay(today);
}, []);
```

### 2. **Render Loading State Sebelum Mounted**

```typescript
if (!mounted) {
  return (
    <div className="page-wrapper anim-fade-up">
      <div className="flex flex-col gap-6 pb-12">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal & Monitoring Ruangan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Memuat data...
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 3. **Hasil**

- ✅ Server me-render loading state
- ✅ Client me-render loading state (sama dengan server)
- ✅ Setelah mounted, client me-render konten penuh
- ✅ Tidak ada hydration mismatch

## 📝 File yang Diubah

### **`src/app/(dashboard)/schedule/page.tsx`**

**Perubahan:**
1. Tambah `mounted` state
2. Set `mounted = true` di useEffect
3. Render loading state jika `!mounted`
4. Render konten penuh jika `mounted`

## 🧪 Testing

### **Test 1: Build**
```bash
npm run build
```
✅ **Result:** Build berhasil tanpa error TypeScript

### **Test 2: Development**
```bash
npm run dev
```
✅ **Result:** Tidak ada hydration error di console

### **Test 3: Production**
```bash
npm run build
npm start
```
✅ **Result:** Halaman schedule berfungsi normal tanpa error

## 📊 Comparison: Before vs After

### **Before (Error):**
```
Server Render:
- role = null
- Conditional: {role === "mahasiswa" && <Tip />}
- Result: Tidak render <Tip />

Client Render:
- role = "mahasiswa" (dari localStorage)
- Conditional: {role === "mahasiswa" && <Tip />}
- Result: Render <Tip />

❌ MISMATCH! Hydration Error!
```

### **After (Fixed):**
```
Server Render:
- mounted = false
- Result: Render loading state

Client Render (First):
- mounted = false
- Result: Render loading state
✅ MATCH!

Client Render (After useEffect):
- mounted = true
- role = "mahasiswa"
- Result: Render konten penuh
✅ No hydration error (sudah mounted)
```

## 🎯 Best Practices

### **1. Hindari Conditional Rendering Berdasarkan Client-Only Data**

❌ **Bad:**
```typescript
export default function Page() {
  const [role, setRole] = useState<string | null>(null);
  
  useEffect(() => {
    setRole(getRole()); // localStorage
  }, []);
  
  return (
    <div>
      {role === "mahasiswa" && <Tip />}
    </div>
  );
}
```

✅ **Good:**
```typescript
export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  
  useEffect(() => {
    setMounted(true);
    setRole(getRole());
  }, []);
  
  if (!mounted) {
    return <LoadingState />;
  }
  
  return (
    <div>
      {role === "mahasiswa" && <Tip />}
    </div>
  );
}
```

### **2. Gunakan `suppressHydrationWarning` untuk Konten Dinamis**

Untuk konten yang memang harus berbeda (seperti timestamp):

```typescript
<time suppressHydrationWarning>
  {new Date().toLocaleString()}
</time>
```

### **3. Hindari `new Date()` di Initial State**

❌ **Bad:**
```typescript
const [date, setDate] = useState(new Date());
```

✅ **Good:**
```typescript
const [date, setDate] = useState<Date | null>(null);

useEffect(() => {
  setDate(new Date());
}, []);
```

## 🚀 Next Steps

1. ✅ Test di browser (Chrome, Firefox, Safari)
2. ✅ Test di mobile (responsive)
3. ✅ Test dengan role mahasiswa
4. ✅ Test dengan role admin
5. ✅ Verify tidak ada console errors

## 📚 Resources

- [Next.js Hydration Errors](https://nextjs.org/docs/messages/react-hydration-error)
- [React Hydration](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Fixing Hydration Mismatches](https://nextjs.org/docs/messages/react-hydration-error#solution-1-using-useeffect-to-run-on-the-client-only)

---

**Tanggal:** 11 Mei 2026  
**Developer:** Kiro AI Assistant  
**Status:** ✅ Fixed
