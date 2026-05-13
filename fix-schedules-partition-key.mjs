/**
 * Script untuk memperbaiki partition key schedules di Cosmos DB
 * Jalankan dengan: node fix-schedules-partition-key.mjs
 */

import { config } from "dotenv";
import { CosmosClient } from "@azure/cosmos";

// Load environment variables
config({ path: ".env.local" });

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || "smartclassdb";

if (!endpoint || !key) {
  console.error("❌ COSMOS_ENDPOINT and COSMOS_KEY must be set in .env.local");
  process.exit(1);
}

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);
const scheduleContainer = database.container("schedules");

async function fixSchedules() {
  console.log("🔧 Fixing schedules partition key issues...\n");
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`📦 Database: ${databaseId}\n`);

  try {
    // Get all schedules
    console.log("📋 Fetching all schedules...");
    const { resources: schedules } = await scheduleContainer.items
      .query("SELECT * FROM c")
      .fetchAll();

    console.log(`✅ Found ${schedules.length} schedules\n`);

    if (schedules.length === 0) {
      console.log("⚠️  No schedules found. Run 'node seed.mjs' to add data.\n");
      return;
    }

    let fixedCount = 0;
    let errorCount = 0;

    for (const schedule of schedules) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Processing: ${schedule.id}`);
      console.log(`Subject: ${schedule.subject || "N/A"}`);

      try {
        // Test if we can read the item
        const { resource: testRead } = await scheduleContainer
          .item(schedule.id, schedule.id)
          .read();

        if (testRead) {
          console.log(`✅ Item is accessible (partition key is correct)`);
        }
      } catch (readError) {
        console.log(`⚠️  Item is NOT accessible with current partition key`);
        console.log(`   Error: ${readError.message}`);
        
        // Try to fix by recreating the item
        try {
          console.log(`🔧 Attempting to fix...`);
          
          // Delete the problematic item (if possible)
          try {
            await scheduleContainer.item(schedule.id, schedule.id).delete();
            console.log(`   ✅ Deleted old item`);
          } catch (deleteError) {
            console.log(`   ⚠️  Could not delete old item: ${deleteError.message}`);
          }
          
          // Recreate with correct structure
          const fixedSchedule = {
            id: schedule.id,
            roomId: schedule.roomId || schedule.room,
            day: schedule.day,
            startTime: schedule.startTime || schedule.start,
            endTime: schedule.endTime || schedule.end,
            subject: schedule.subject,
            lecturer: schedule.lecturer,
            class: schedule.class,
            semester: schedule.semester || "Ganjil",
            academicYear: schedule.academicYear || "2025/2026",
            createdAt: schedule.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          await scheduleContainer.items.create(fixedSchedule);
          console.log(`   ✅ Recreated item with correct partition key`);
          fixedCount++;
        } catch (fixError) {
          console.log(`   ❌ Failed to fix: ${fixError.message}`);
          errorCount++;
        }
      }
      
      console.log("");
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`📊 Summary:`);
    console.log(`   Total schedules: ${schedules.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Already OK: ${schedules.length - fixedCount - errorCount}`);
    
    if (fixedCount > 0) {
      console.log(`\n✅ Fixed ${fixedCount} schedule(s)!`);
    }
    
    if (errorCount > 0) {
      console.log(`\n⚠️  ${errorCount} schedule(s) could not be fixed.`);
      console.log(`   You may need to delete and recreate them manually.`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

fixSchedules();
