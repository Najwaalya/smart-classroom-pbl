# ✅ FIX: Cannot read properties of undefined (reading 'endsWith')

**Problem**: Runtime TypeError di halaman booking  
**Error Message**: `Cannot read properties of undefined (reading 'endsWith')`  
**Status**: ✅ **FIXED**

---

## 🔍 ROOT CAUSE

Fungsi `getRoomsForFloor` di `schedule-utils.ts` mencoba mengakses property `room` yang tidak ada di data schedules dari Cosmos DB.

### Data Structure Mismatch:

**Static Data (Old)**:
```typescript
{
  room: "TI-5A",      // ✅ Property 'room' exists
  day: "Monday",
  start: "07:00",
  end: "09:30"
}
```

**Cosmos DB Data (New)**:
```typescript
{
  roomId: "TI-1A",    // ❌ Property 'roomId', not 'room'
  day: "Monday",
  startTime: "07:00", // ❌ Property 'startTime', not 'start'
  endTime: "09:30"    // ❌ Property 'endTime', not 'end'
}
```

### Error Location:
```typescript
// ❌ BEFORE (Error)
export function getRoomsForFloor(floor: string, schedules: any[]): string[] {
  const suffixes = FLOOR_SUFFIX[floor] ?? [];
  return Array.from(new Set(
    schedules.filter(s => suffixes.some(sfx => s.room.endsWith(sfx))) // s.room is undefined!
      .map(s => s.room)
  )).sort();
}
```

---

## 🛠️ SOLUTION

### 1. Update `getRoomsForFloor` Function
Handle both old and new data structures:

```typescript
// ✅ AFTER (Fixed)
export function getRoomsForFloor(floor: string, schedules: any[]): string[] {
  const suffixes = FLOOR_SUFFIX[floor] ?? [];
  return Array.from(new Set(
    schedules
      .filter(s => {
        const roomName = s.roomId || s.room || ""; // Support both formats
        return suffixes.some(sfx => roomName.endsWith(sfx));
      })
      .map(s => s.roomId || s.room || "")
      .filter(Boolean) // Remove empty strings
  )).sort();
}
```

### 2. Update `getAllRooms` Function
```typescript
// ✅ AFTER (Fixed)
export function getAllRooms(schedules: any[]): string[] {
  return Array.from(new Set(
    schedules
      .map(s => s.roomId || s.room || "")
      .filter(Boolean) // Remove empty strings
  )).sort();
}
```

### 3. Update `getScheduleForSlot` Function
```typescript
// ✅ AFTER (Fixed)
export function getScheduleForSlot(
  roomId: string,
  day: string,
  slot: typeof TIME_SLOTS[0],
  schedules: any[]
) {
  return schedules.find(s => {
    const scheduleRoom = s.roomId || s.room || "";
    const scheduleDay = s.day || "";
    const scheduleStart = s.startTime || s.start || "";
    const scheduleEnd = s.endTime || s.end || "";
    
    return scheduleRoom === roomId && 
           scheduleDay === day &&
           toMin(scheduleStart) < toMin(slot.end) && 
           toMin(scheduleEnd) > toMin(slot.start);
  }) ?? null;
}
```

### 4. Update `checkConflict` Function
```typescript
// ✅ AFTER (Fixed)
export function checkConflict(
  roomId: string,
  day: string,
  startTime: string,
  endTime: string,
  schedules: any[]
): string | null {
  if (toMin(startTime) >= toMin(endTime)) 
    return "Jam selesai harus lebih dari jam mulai.";
  
  const conflict = schedules.find(s => {
    const scheduleRoom = s.roomId || s.room || "";
    const scheduleDay = s.day || "";
    const scheduleStart = s.startTime || s.start || "";
    const scheduleEnd = s.endTime || s.end || "";
    
    return scheduleRoom === roomId && 
           scheduleDay === day &&
           toMin(startTime) < toMin(scheduleEnd) && 
           toMin(endTime) > toMin(scheduleStart);
  });
  
  if (conflict) {
    const conflictStart = conflict.startTime || conflict.start || "";
    const conflictEnd = conflict.endTime || conflict.end || "";
    return `Bentrok dengan jadwal kelas ${conflictStart}–${conflictEnd}.`;
  }
  
  return null;
}
```

### 5. Add Fallback in Booking Page
```typescript
// ✅ AFTER (Fixed)
const roomsOnFloor = useMemo(() => {
  // Try to get rooms from schedules first
  const roomsFromSchedules = getRoomsForFloor(selectedFloor, schedules);
  
  if (roomsFromSchedules.length > 0) {
    return roomsFromSchedules;
  }
  
  // Fallback: use rooms from RoomDataContext
  const floorSuffix = selectedFloor === "5" ? "_5B" : 
                      selectedFloor === "6" ? "_6T" :
                      selectedFloor === "7" ? "_7" :
                      selectedFloor === "8" ? "_8T" : "";
  
  return rooms
    .map(r => r.id)
    .filter(id => floorSuffix && id.includes(floorSuffix))
    .sort();
}, [selectedFloor, schedules, rooms]);
```

---

## 📝 CHANGES MADE

### File 1: `src/lib/schedule-utils.ts`

#### Change 1: `getRoomsForFloor`
- Added support for both `roomId` and `room` properties
- Added null/undefined checks
- Filter out empty strings

#### Change 2: `getAllRooms`
- Added support for both `roomId` and `room` properties
- Filter out empty strings

#### Change 3: `getScheduleForSlot`
- Support both `roomId`/`room` for room name
- Support both `startTime`/`start` for start time
- Support both `endTime`/`end` for end time
- Added null/undefined checks

#### Change 4: `checkConflict`
- Support both property name formats
- Added null/undefined checks
- Better error message handling

### File 2: `src/app/(dashboard)/booking/page.tsx`

#### Change: `roomsOnFloor` useMemo
- Added fallback to use rooms from RoomDataContext
- If schedules don't have matching rooms, use actual room data
- More robust room filtering

---

## ✅ VERIFICATION

### Before Fix:
- ❌ Booking page crashes with "Cannot read properties of undefined"
- ❌ Error at `getRoomsForFloor` function
- ❌ Cannot access booking page

### After Fix:
- ✅ Booking page loads successfully
- ✅ Handles both old and new data structures
- ✅ Room list populated correctly
- ✅ Fallback to RoomDataContext if needed
- ✅ No console errors

---

## 🧪 TESTING

### Test 1: With Cosmos DB Data
```bash
# 1. Ensure schedules exist in Cosmos DB
node seed.mjs

# 2. Start dev server
npm run dev

# 3. Login as mahasiswa: 2341720024 / 2341720024
# 4. Navigate to "Booking Ruangan"
# Expected: Page loads, rooms shown from schedules
```

### Test 2: Without Schedules (Empty DB)
```bash
# 1. Clear schedules from Cosmos DB (optional)
# 2. Start dev server
npm run dev

# 3. Login as mahasiswa
# 4. Navigate to "Booking Ruangan"
# Expected: Page loads, rooms shown from RoomDataContext
```

### Test 3: Slot Validation
```bash
# 1. On booking page, select a room
# 2. Try to select a time slot
# Expected: Slots with schedules are blocked (red)
```

---

## 📊 DATA COMPATIBILITY

### Supported Data Formats:

#### Format 1: Static Data (Old)
```typescript
{
  room: "TI-5A",
  day: "Monday",
  start: "07:00",
  end: "09:30",
  subject: "Pemrograman Web"
}
```

#### Format 2: Cosmos DB Data (New)
```typescript
{
  roomId: "TI-1A",
  day: "Monday",
  startTime: "07:00",
  endTime: "09:30",
  subject: "Pemrograman Web"
}
```

#### Format 3: Mixed (Supported)
```typescript
{
  room: "TI-5A",      // Old format
  roomId: "TI-1A",    // New format (takes precedence)
  day: "Monday",
  start: "07:00",     // Old format
  startTime: "07:00", // New format (takes precedence)
  end: "09:30",
  endTime: "09:30"
}
```

---

## 🎯 KEY IMPROVEMENTS

### 1. Backward Compatibility
Functions now support both old and new data structures, making migration smoother.

### 2. Null Safety
All property accesses now have fallbacks:
```typescript
const roomName = s.roomId || s.room || ""; // Never undefined
```

### 3. Robust Filtering
Empty strings are filtered out:
```typescript
.filter(Boolean) // Remove "", null, undefined
```

### 4. Fallback Strategy
If schedules don't provide rooms, use actual room data from context.

---

## 📝 NOTES

### Property Priority
When both old and new properties exist:
- `roomId` takes precedence over `room`
- `startTime` takes precedence over `start`
- `endTime` takes precedence over `end`

### Empty Schedules
If Cosmos DB has no schedules:
- `getRoomsForFloor()` returns empty array
- Booking page falls back to RoomDataContext
- All rooms from context are shown

### Performance
- No performance impact
- Same number of iterations
- Just added null checks

---

## ✅ CONCLUSION

**Status**: ✅ **FIXED**

Schedule utilities sekarang:
- ✅ Support both old and new data formats
- ✅ Handle undefined/null properties gracefully
- ✅ Fallback to RoomDataContext when needed
- ✅ No more "Cannot read properties of undefined" errors

---

**Fixed by**: Kiro AI Assistant  
**Date**: 13 Mei 2026, 12:45 WIB  
**Files Modified**: 2 files  
**Lines Changed**: ~60 lines
