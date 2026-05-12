import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT!,
  key: process.env.COSMOS_KEY!,
});

const database = client.database("smartclassroomdb");

export const bookingContainer =
  database.container("booking");

export const sessionContainer =
  database.container("sessions");

export const statusLogContainer =
  database.container("statuslogs");

export const roomContainer =
  database.container("rooms");

export const scheduleContainer =
  database.container("schedules");

export const sensorContainer =
  database.container("sensors");

export const userContainer =
  database.container("users");