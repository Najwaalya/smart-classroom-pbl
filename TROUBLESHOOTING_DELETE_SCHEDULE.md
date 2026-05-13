# 🔧 TROUBLESHOOTING: Delete Schedule Error

**Problem**: Tidak bisa menghapus jadwal dari Cosmos DB  
**Error Message**: "Gagal menghapus: Gagal menghapus jadwal"

---

## 🔍 DIAGNOSIS

### 1. Cek Console Browser
Buka browser console (F12) dan lihat error message lengkap saat mencoba delete.

### 2. Cek Server Logs
Lihat terminal tempat `npm run dev` berjalan untuk melihat error dari server.

### 3. Test Delete Langsung ke Cosmos DB
Jalankan script test untuk memastikan koneksi ke Cosmos DB:

```bash
node test-delete-schedule.mjs
```

Script ini akan:
- List semua schedules di database
- Mencoba delete schedule pertama
- Menampilkan error detail jika gagal

---

## 🛠️ POSSIBLE CAUSES & SOLUTIONS

### Cause 1: Partition Key Mismatch
**Symptom**: Error code 400 atau "PartitionKey mismatch"

**Solution**: Pastikan partition key yang digunakan benar.

Schedules container menggunakan partition key `/id`, jadi:
```typescript
// ✅ CORRECT
await scheduleContainer.item(scheduleId, scheduleId).delete();

// ❌ WRONG
await scheduleContainer.item(scheduleId, "wrong-partition-key").delete();
```

---

### Cause 2: Schedule Not Found
**Symptom**: Error "Schedule not found" atau 404

**Solution**: Pastikan schedule ID yang dikirim benar.

Check di browser console:
```javascript
console.log("Deleting schedule ID:", schedule.id);
```

---

### Cause 3: Permission Issues
**Symptom**: Error 403 atau "Forbidden"

**Solution**: Pastikan Cosmos DB key memiliki permission untuk delete.

Check `.env.local`:
```env
COSMOS_KEY=<your-primary-key-or-secondary-key>
```

Pastikan menggunakan **Primary Key** atau **Secondary Key**, bukan **Read-only Key**.

---

### Cause 4: URL Encoding Issues
**Symptom**: Schedule ID dengan karakter khusus (-, :, dll) tidak bisa dihapus

**Solution**: Pastikan ID di-encode dengan benar.

Di `manage-schedule/page.tsx`:
```typescript
// ✅ CORRECT
const res = await fetch(`/api/schedules?id=${encodeURIComponent(schedule.id)}`, { 
  method: "DELETE" 
});

// ❌ WRONG
const res = await fetch(`/api/schedules?id=${schedule.id}`, { 
  method: "DELETE" 
});
```

---

### Cause 5: Cosmos DB Connection Issues
**Symptom**: Timeout atau connection error

**Solution**: 
1. Check internet connection
2. Verify Cosmos DB endpoint is correct
3. Check if Cosmos DB account is active in Azure Portal

---

## 🧪 TESTING STEPS

### Step 1: Verify Schedule Exists
```bash
# List all schedules
node -e "
import { CosmosClient } from '@azure/cosmos';
import { config } from 'dotenv';
config({ path: '.env.local' });
const client = new CosmosClient({ 
  endpoint: process.env.COSMOS_ENDPOINT, 
  key: process.env.COSMOS_KEY 
});
const container = client.database('smartclassdb').container('schedules');
const { resources } = await container.items.query('SELECT * FROM c').fetchAll();
console.log(resources);
"
```

### Step 2: Test Delete via Script
```bash
node test-delete-schedule.mjs
```

### Step 3: Test Delete via API
```bash
# Get schedule ID first
curl http://localhost:3000/api/schedules

# Then delete (replace SCHEDULE_ID with actual ID)
curl -X DELETE "http://localhost:3000/api/schedules?id=TI-1A-Monday-07:00-1"
```

### Step 4: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to delete a schedule
4. Look for error messages

---

## 📝 UPDATED CODE

### 1. `src/lib/services/schedule.service.ts`
```typescript
export async function deleteSchedule(
  scheduleId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`[deleteSchedule] Attempting to delete: ${scheduleId}`);
    
    // Read first to verify it exists
    const { resource: schedule } = await scheduleContainer
      .item(scheduleId, scheduleId)
      .read<Schedule>();

    if (!schedule) {
      console.error(`[deleteSchedule] Not found: ${scheduleId}`);
      return { success: false, message: "Jadwal tidak ditemukan" };
    }

    // Delete using correct partition key
    await scheduleContainer.item(scheduleId, scheduleId).delete();
    
    console.log(`[deleteSchedule] Successfully deleted: ${scheduleId}`);
    return { success: true };
  } catch (error: any) {
    console.error("[deleteSchedule] Error:", error);
    return { 
      success: false, 
      message: `Gagal menghapus jadwal: ${error.message}` 
    };
  }
}
```

### 2. `src/app/api/schedules/route.ts`
```typescript
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("id");

    console.log("[API DELETE] Schedule ID:", scheduleId);

    if (!scheduleId) {
      return NextResponse.json(
        { success: false, message: "Schedule ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteSchedule(scheduleId);
    
    console.log("[API DELETE] Result:", result);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API DELETE] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
```

### 3. `src/app/(dashboard)/manage-schedule/page.tsx`
```typescript
const handleDeleteSchedule = async (schedule: Schedule) => {
  if (!confirm(`Yakin ingin menghapus jadwal "${schedule.subject}"?`)) return;

  if (schedule._source === "cosmos" && dbStatus === "online") {
    try {
      console.log("[Delete] Schedule ID:", schedule.id);
      
      const res = await fetch(
        `/api/schedules?id=${encodeURIComponent(schedule.id)}`, 
        { method: "DELETE" }
      );
      
      const data = await res.json();
      console.log("[Delete] Response:", data);
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menghapus");
      }
      
      setSuccessMsg("Jadwal berhasil dihapus!");
      await loadSchedules();
    } catch (err) {
      console.error("[Delete] Error:", err);
      setErrorMsg(`Gagal menghapus: ${err.message}`);
    }
  }
};
```

---

## ✅ VERIFICATION

After applying fixes, verify:

1. **Browser Console**: No errors when deleting
2. **Server Logs**: Shows successful delete message
3. **Database**: Schedule is actually deleted (check via Azure Portal or script)
4. **UI**: Schedule disappears from list after delete

---

## 🆘 STILL NOT WORKING?

If delete still fails after trying all solutions:

1. **Check Cosmos DB Status**
   - Go to Azure Portal
   - Check if Cosmos DB account is active
   - Check if there are any service issues

2. **Verify Permissions**
   - Make sure you're using Primary Key or Secondary Key
   - Not using Read-only Key

3. **Check Schedule ID Format**
   - IDs should match format: `"TI-1A-Monday-07:00-1"`
   - No special characters that need escaping

4. **Try Manual Delete**
   - Go to Azure Portal
   - Navigate to Cosmos DB → Data Explorer
   - Try to delete schedule manually
   - If manual delete works, problem is in code
   - If manual delete fails, problem is in Cosmos DB

---

**Created**: 13 Mei 2026  
**Last Updated**: 13 Mei 2026, 12:00 WIB
