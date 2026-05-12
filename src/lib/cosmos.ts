import { CosmosClient } from "@azure/cosmos";

// Ensure environment variables are loaded
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || "smartclassdb";

if (!endpoint || !key) {
  throw new Error(
    "COSMOS_ENDPOINT and COSMOS_KEY must be set in environment variables"
  );
}

const client = new CosmosClient({
  endpoint,
  key,
});

const database = client.database(databaseId);

export const bookingContainer =
  database.container("bookings");

export const sessionContainer =
  database.container("class_sessions");

export const statusLogContainer =
  database.container("room_status_logs");

export const roomContainer =
  database.container("rooms");

export const scheduleContainer =
  database.container("schedules");

export const sensorContainer =
  database.container("sensors_readings");

export const userContainer =
  database.container("users");