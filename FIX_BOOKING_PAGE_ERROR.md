# ✅ FIX: Booking Page Error - "schedules is not defined"

**Problem**: Runtime error di halaman booking  
**Error Message**: `ReferenceError: schedules is not defined`  
**Status**: ✅ **FIXED**

---

## 🔍 ROOT CAUSE

Setelah menghapus data statis dari `src/lib/schedule.ts`, halaman booking masih mencoba menggunakan variabel `schedules` yang tidak lagi didefinisikan.

### Error Location:
```typescript
// ❌ BEFORE (Error)
const roomsOnFloor = useMemo(
  () => getRoomsForFloor(selectedFloor, schedules), // schedules tidak didefinisikan!
  [selectedFloor]
);
```

---

## 🛠️ SOLUTION

### 1. Fetch Schedules dari API
Tambahkan SWR hook untuk fetch schedules dari Cosmos DB:

```typescript
// ✅ AFTER (Fixed)
const {
  data: schedulesData,
  isLoading: schedulesLoading,
} = useSWR<{ success: boolean; schedules: any[] }>(
  "/api/schedules",
  fetcher,
  {
    refreshInterval: 30000, // Auto-refresh setiap 30 detik
  }
);

const schedules = useMemo(() => {
  if (!schedulesData || !schedulesData.success) return [];
  return Array.isArray(schedulesData.schedules) ? schedulesData.schedules : [];
}, [schedulesData]);
```

### 2. Update Dependency Array
Tambahkan `schedules` ke dependency array:

```typescript
// ✅ AFTER (Fixed)
const roomsOnFloor = useMemo(
  () => getRoomsForFloor(selectedFloor, schedules),
  [selectedFloor, schedules] // Tambahkan schedules
);
```

### 3. Update Loading State
Tambahkan loading state untuk schedules:

```typescript
// ✅ AFTER (Fixed)
if (isLoading || schedulesLoading) {
  return (
    <div className="page-wrapper">
      <div className="py-10 text-sm text-slate-500">
        Loading data...
      </div>
    </div>
  );
}
```

---

## 📝 CHANGES MADE

### File: `src/app/(dashboard)/booking/page.tsx`

#### Change 1: Added Schedules Fetch
```typescript
// Line ~140
const {
  data: schedulesData,
  isLoading: schedulesLoading,
} = useSWR<{ success: boolean; schedules: any[] }>(
  "/api/schedules",
  fetcher,
  {
    refreshInterval: 30000,
  }
);

const schedules = useMemo(() => {
  if (!schedulesData || !schedulesData.success) return [];
  return Array.isArray(schedulesData.schedules) ? schedulesData.schedules : [];
}, [schedulesData]);
```

#### Change 2: Updated Dependency Array
```typescript
// Line ~180
const roomsOnFloor = useMemo(
  () => getRoomsForFloor(selectedFloor, schedules),
  [selectedFloor, schedules] // Added schedules
);
```

#### Change 3: Updated Loading State
```typescript
// Line ~650
if (isLoading || schedulesLoading) {
  return (
    <div className="page-wrapper">
      <div className="py-10 text-sm text-slate-500">
        Loading data...
      </div>
    </div>
  );
}
```

---

## ✅ VERIFICATION

### Before Fix:
- ❌ Booking page crashes with "schedules is not defined"
- ❌ Cannot access booking page
- ❌ Console shows ReferenceError

### After Fix:
- ✅ Booking page loads successfully
- ✅ Schedules fetched from Cosmos DB
- ✅ Room list populated correctly
- ✅ Slot validation works (checks against schedules from DB)
- ✅ No console errors

---

## 🧪 TESTING

### Test 1: Page Load
```bash
# 1. Start dev server
npm run dev

# 2. Login as mahasiswa
# Email: 2341720024
# Password: 2341720024

# 3. Navigate to "Booking Ruangan"
# Expected: Page loads without errors
```

### Test 2: Schedule Validation
```bash
# 1. On booking page, select a room
# 2. Try to select a time slot that has a class schedule
# Expected: Slot should be blocked (red color)
```

### Test 3: Booking Creation
```bash
# 1. Select an available slot (green)
# 2. Fill in purpose
# 3. Click "Booking Sekarang"
# Expected: Booking created successfully
```

---

## 📊 DATA FLOW

### Before (Broken):
```
BookingPage
    ↓
getRoomsForFloor(selectedFloor, schedules) ← schedules undefined!
    ↓
❌ ReferenceError
```

### After (Fixed):
```
BookingPage
    ↓
useSWR("/api/schedules") → Fetch from Cosmos DB
    ↓
schedules = schedulesData.schedules
    ↓
getRoomsForFloor(selectedFloor, schedules) ← schedules defined!
    ↓
✅ Works correctly
```

---

## 🎯 RELATED FIXES

This fix is part of the larger migration to remove all static data:

1. ✅ **auth.ts** - Removed FALLBACK_USERS
2. ✅ **schedule.ts** - Removed static schedules array
3. ✅ **schedule-loader.ts** - Updated to accept schedules as parameter
4. ✅ **booking/page.tsx** - Fetch schedules from API (THIS FIX)
5. ⚠️ **room/[id]/page.tsx** - Still needs update
6. ⚠️ **BookingModal.tsx** - Still needs update

---

## 📝 NOTES

### Auto-refresh
Schedules are auto-refreshed every 30 seconds using SWR:
```typescript
refreshInterval: 30000 // 30 seconds
```

This ensures the booking page always has the latest schedule data.

### Empty Schedules
If Cosmos DB is empty or offline, `schedules` will be an empty array `[]`:
- `getRoomsForFloor()` will return empty array
- No rooms will be shown in the dropdown
- User will see "No rooms available" message

### Performance
SWR caches the schedules data, so:
- First load: Fetches from API
- Subsequent loads: Uses cached data
- Auto-revalidates in background
- Minimal network requests

---

## ✅ CONCLUSION

**Status**: ✅ **FIXED**

Booking page sekarang:
- ✅ Fetch schedules dari Cosmos DB
- ✅ Tidak ada lagi error "schedules is not defined"
- ✅ Validasi slot booking bekerja dengan benar
- ✅ Auto-refresh setiap 30 detik

---

**Fixed by**: Kiro AI Assistant  
**Date**: 13 Mei 2026, 12:30 WIB  
**Files Modified**: 1 file (`booking/page.tsx`)  
**Lines Changed**: ~20 lines
