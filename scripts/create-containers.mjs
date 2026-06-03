/**
 * Script untuk membuat containers di Cosmos DB
 * Jalankan dengan: node create-containers.mjs
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

async function createDatabase() {
  console.log(`🔍 Checking database: ${databaseId}...`);
  
  try {
    const { database } = await client.databases.createIfNotExists({
      id: databaseId,
    });
    console.log(`✅ Database ready: ${database.id}`);
    return database;
  } catch (error) {
    console.error(`❌ Error creating database:`, error.message);
    throw error;
  }
}

async function createContainers(database) {
  console.log("\n🌱 Creating containers...\n");

  const containers = [
    {
      id: "users",
      partitionKey: "/id",
      description: "User data (mahasiswa & dosen)",
    },
    {
      id: "rooms",
      partitionKey: "/id",
      description: "Room data",
    },
    {
      id: "schedules",
      partitionKey: "/id",
      description: "Class schedules",
    },
    {
      id: "bookings",
      partitionKey: "/id",
      description: "Room bookings",
    },
    {
      id: "sessions",
      partitionKey: "/sessionNumber",
      description: "Master sessions (schedule time slots)",
    },
    {
      id: "sensors_readings",
      partitionKey: "/roomId",
      description: "Sensor readings (temperature, humidity, PIR, IR)",
    },
    {
      id: "room_status_logs",
      partitionKey: "/roomId",
      description: "Room status logs",
    },
  ];

  for (const containerDef of containers) {
    try {
      const { container } = await database.containers.createIfNotExists({
        id: containerDef.id,
        partitionKey: { paths: [containerDef.partitionKey] },
        // No throughput for serverless accounts
      });

      console.log(`✅ Container: ${container.id.padEnd(20)} | Partition: ${containerDef.partitionKey.padEnd(10)} | ${containerDef.description}`);
    } catch (error) {
      console.error(`❌ Error creating container ${containerDef.id}:`, error.message);
    }
  }
}

async function main() {
  console.log("🚀 Starting Cosmos DB setup...\n");
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`📦 Database: ${databaseId}\n`);

  try {
    const database = await createDatabase();
    await createContainers(database);

    console.log("\n✅ Cosmos DB setup completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Run: node seed.mjs");
    console.log("   2. Run: npm run dev");
    console.log("   3. Open: http://localhost:3000/login\n");
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
}

main();
