/**
 * Test script untuk cek data di Cosmos DB
 */

import { config } from "dotenv";
import { CosmosClient } from "@azure/cosmos";

config({ path: ".env.local" });

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || "smartclassdb";

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

async function testContainers() {
  console.log("🔍 Testing Cosmos DB containers...\n");

  const containers = ["users", "rooms", "schedules", "bookings"];

  for (const containerName of containers) {
    try {
      const container = database.container(containerName);
      const { resources } = await container.items.query("SELECT * FROM c").fetchAll();
      
      console.log(`📦 ${containerName.padEnd(15)} | Count: ${resources.length}`);
      
      if (resources.length > 0) {
        console.log(`   Sample:`, JSON.stringify(resources[0], null, 2).substring(0, 200) + "...");
      }
      console.log();
    } catch (error) {
      console.error(`❌ Error reading ${containerName}:`, error.message);
    }
  }
}

testContainers();
