/**
 * Script untuk test delete schedule dari Cosmos DB
 * Jalankan dengan: node test-delete-schedule.mjs
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

async function listSchedules() {
  console.log("📋 Listing all schedules...\n");

  try {
    const { resources: schedules } = await scheduleContainer.items
      .query("SELECT * FROM c")
      .fetchAll();

    console.log(`Found ${schedules.length} schedules:\n`);

    schedules.forEach((schedule, index) => {
      console.log(`${index + 1}. ID: ${schedule.id}`);
      console.log(`   Subject: ${schedule.subject || "N/A"}`);
      console.log(`   Room: ${schedule.roomId || schedule.room || "N/A"}`);
      console.log(`   Day: ${schedule.day || "N/A"}`);
      console.log(`   Time: ${schedule.startTime || schedule.start || "N/A"} - ${schedule.endTime || schedule.end || "N/A"}`);
      console.log("");
    });

    return schedules;
  } catch (error) {
    console.error("❌ Error listing schedules:", error.message);
    throw error;
  }
}

async function testDeleteSchedule(scheduleId) {
  console.log(`\n🗑️  Testing delete for schedule: ${scheduleId}\n`);

  try {
    // Method 1: Read first, then delete
    console.log("Method 1: Read first, then delete");
    const { resource: schedule } = await scheduleContainer
      .item(scheduleId, scheduleId)
      .read();

    if (!schedule) {
      console.error("❌ Schedule not found!");
      return false;
    }

    console.log("✅ Schedule found:", schedule.subject);

    // Now delete
    await scheduleContainer.item(scheduleId, scheduleId).delete();
    console.log("✅ Schedule deleted successfully!");

    return true;
  } catch (error) {
    console.error("❌ Error deleting schedule:", error.message);
    console.error("Error code:", error.code);
    console.error("Status code:", error.statusCode);
    console.error("Error body:", error.body);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting delete test...\n");
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`📦 Database: ${databaseId}\n`);

  try {
    // List all schedules
    const schedules = await listSchedules();

    if (schedules.length === 0) {
      console.log("⚠️  No schedules found. Run 'node seed.mjs' first.");
      return;
    }

    // Test delete on the first schedule
    const firstSchedule = schedules[0];
    console.log(`\n🎯 Will test delete on: ${firstSchedule.id}`);
    console.log("⚠️  WARNING: This will actually delete the schedule!");
    console.log("Press Ctrl+C to cancel, or wait 3 seconds...\n");

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    const success = await testDeleteSchedule(firstSchedule.id);

    if (success) {
      console.log("\n✅ Delete test completed successfully!");
      console.log("\n📝 To restore the schedule, run: node seed.mjs");
    } else {
      console.log("\n❌ Delete test failed!");
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

main();
