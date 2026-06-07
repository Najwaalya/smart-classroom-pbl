/**
 * Azure Cosmos DB Connection Module
 * ===================================
 * Koneksi dinamis ke Azure Cosmos DB menggunakan kredensial dari .env.local
 * Tidak ada hardcoded endpoint atau key di file ini.
 */

import { CosmosClient, Database } from "@azure/cosmos";

// ==========================================
// Environment Variables Validation
// ==========================================

const endpoint = process.env.COSMOS_ENDPOINT?.trim();
const key = process.env.COSMOS_KEY?.trim();
const databaseId = process.env.COSMOS_DATABASE?.trim() || "smartclassdb";

// Validasi ketat: endpoint dan key harus ada
if (!endpoint) {
  const msg =
    "[Cosmos DB] FATAL: process.env.COSMOS_ENDPOINT tidak ditemukan atau kosong. " +
    "Pastikan variabel COSMOS_ENDPOINT telah diset di .env.local";
  console.error(msg);
  throw new Error(msg);
}

if (!key) {
  const msg =
    "[Cosmos DB] FATAL: process.env.COSMOS_KEY tidak ditemukan atau kosong. " +
    "Pastikan variabel COSMOS_KEY telah diset di .env.local";
  console.error(msg);
  throw new Error(msg);
}

console.log(
  `[Cosmos DB] Menghubungkan ke Azure Cosmos DB...\n` +
  `  Endpoint: ${endpoint}\n` +
  `  Database: ${databaseId}`
);

// ==========================================
// Cosmos DB Client Initialization
// ==========================================

export const client = new CosmosClient({
  endpoint,
  key,
});

export const database: Database = client.database(databaseId);

console.log("[Cosmos DB] Koneksi berhasil diinisialisasi.");

// ==========================================
// Container Exports
// Mengakses kontainer secara instan tanpa cache
// ==========================================

export const userContainer = database.container("users");
export const scheduleContainer = database.container("schedules");
export const sensorContainer = database.container("sensors_readings");
export const bookingContainer = database.container("bookings");
export const roomContainer = database.container("rooms");
export const statusLogContainer = database.container("room_status_logs");
export const sessionContainer = database.container("class_sessions");

// ==========================================
// Helper Functions
// ==========================================

/**
 * Mendapatkan referensi ke kontainer tertentu
 * @param containerName Nama kontainer
 * @returns Referensi kontainer
 */
export function getContainer(containerName: string) {
  return database.container(containerName);
}

/**
 * Mendapatkan informasi koneksi Cosmos DB
 * @returns Object berisi endpoint, database id, dan status
 */
export function getConnectionInfo() {
  return {
    endpoint,
    database: databaseId,
    connected: true,
    timestamp: new Date().toISOString(),
  };
}