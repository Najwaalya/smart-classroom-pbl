/**
 * Script untuk debug schedules di Cosmos DB
 * Jalankan dengan: node debug-schedules.mjs
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

async function debugSchedules() {
  console.log("🔍 Debugging schedules in Cosmos DB...\n");
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`📦 Database: ${databaseId}\n`);

  try {
    // Get all schedules
    const { resources: schedules } = await scheduleContainer.items
      .query("SELECT * FROM c")
      .fetchAll();

    console.log(`✅ Found ${schedules.length} schedules\n`);

    if (schedules.length === 0) {
      console.log("⚠️  No schedules found. Run 'node seed.mjs' to add data.\n");
      return;
    }

    // Display each schedule
    schedules.forEach((schedule, index) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Schedule ${index + 1}:`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`ID:           ${schedule.id}`);
      console.log(`Room ID:      ${schedule.roomId || "N/A"}`);
      console.log(`Day:          ${schedule.day || "N/A"}`);
      console.log(`Start Time:   ${schedule.startTime || "N/A"}`);
      console.log(`End Time:     ${schedule.endTime || "N/A"}`);
      console.log(`Subject:      ${schedule.subject || "N/A"}`);
      console.log(`Lecturer:     ${schedule.lecturer || "N/A"}`);
      console.log(`Class:        ${schedule.class || "N/A"}`);
      console.log(`Semester:     ${schedule.semester || "N/A"}`);
      console.log(`Academic Yr:  ${schedule.academicYear || "N/A"}`);
      console.log(`Created At:   ${schedule.createdAt || "N/A"}`);
      console.log("");
    });

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Test delete on first schedule
    if (schedules.length > 0) {
      const firstSchedule = schedules[0];
      console.log(`🧪 Testing delete on schedule: ${firstSchedule.id}\n`);

      try {
        // Method 1: Query first
        console.log("Method 1: Query first, then delete");
        const querySpec = {
          query: "SELECT * FROM c WHERE c.id = @id",
          parameters: [{ name: "@id", value: firstSchedule.id }],
        };

        const { resources: found } = await scheduleContainer.items
          .query(querySpec)
          .fetchAll();

        if (found.length > 0) {
          console.log("✅ Schedule found via query");
          console.log(`   ID: ${found[0].id}`);
          console.log(`   Partition Key: ${found[0].id}`);
          
          // Try to delete
          console.log("\n🗑️  Attempting delete...");
          await scheduleContainer.item(found[0].id, found[0].id).delete();
          console.log("✅ Delete successful!");
          
          console.log("\n⚠️  Schedule was deleted. Run 'node seed.mjs' to restore.");
        } else {
          console.log("❌ Schedule not found via query");
        }
      } catch (error) {
        console.error("❌ Delete test failed:", error.message);
        console.error("   Error code:", error.code);
        console.error("   Status code:", error.statusCode);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

debugSchedules();
