/**
 * Script untuk seed data awal ke Cosmos DB
 * Jalankan dengan: npx tsx src/lib/seed-data.ts
 */

// Load environment variables
import { config } from "dotenv";
config({ path: ".env.local" });

import {
  userContainer,
  roomContainer,
  scheduleContainer,
} from "./cosmos";

async function seedUsers() {
  console.log("🌱 Seeding users...");

  const users = [
    {
      id: "197805122005011002",
      email: "dosen@gmail.com",
      nip: "197805122005011002",
      password: "197805122005011002",
      role: "admin",
      name: "Dr. Budi Santoso, M.T.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2341720024",
      nim: "2341720024",
      password: "2341720024",
      role: "student",
      name: "Moch. A.B.A",
      createdAt: new Date().toISOString(),
    },
  ];

  for (const user of users) {
    try {
      await userContainer.items.upsert(user);
      console.log(`✅ Created/Updated user: ${user.name}`);
    } catch (error) {
      console.error(`❌ Error creating user ${user.name}:`, error);
    }
  }
}

async function seedRooms() {
  console.log("\n🌱 Seeding rooms...");

  const rooms = [
    {
      id: "TI-1A",
      name: "TI-1A",
      wing: "Gedung TI",
      capacity: 40,
      status: "empty",
      createdAt: new Date().toISOString(),
    },
    {
      id: "TI-1B",
      name: "TI-1B",
      wing: "Gedung TI",
      capacity: 40,
      status: "empty",
      createdAt: new Date().toISOString(),
    },
    {
      id: "TI-2A",
      name: "TI-2A",
      wing: "Gedung TI",
      capacity: 40,
      status: "empty",
      createdAt: new Date().toISOString(),
    },
    {
      id: "TI-2B",
      name: "TI-2B",
      wing: "Gedung TI",
      capacity: 40,
      status: "empty",
      createdAt: new Date().toISOString(),
    },
  ];

  for (const room of rooms) {
    try {
      await roomContainer.items.upsert(room);
      console.log(`✅ Created/Updated room: ${room.name}`);
    } catch (error) {
      console.error(`❌ Error creating room ${room.name}:`, error);
    }
  }
}

async function seedSchedules() {
  console.log("\n🌱 Seeding schedules...");

  const schedules = [
    {
      id: "TI-1A-Monday-07:00-1",
      roomId: "TI-1A",
      day: "Monday",
      startTime: "07:00",
      endTime: "09:30",
      subject: "Pemrograman Web",
      lecturer: "Dr. Budi Santoso, M.T.",
      class: "TI-2A",
      semester: "Ganjil",
      academicYear: "2025/2026",
      createdAt: new Date().toISOString(),
    },
    {
      id: "TI-1A-Monday-10:00-1",
      roomId: "TI-1A",
      day: "Monday",
      startTime: "10:00",
      endTime: "12:30",
      subject: "Basis Data",
      lecturer: "Dr. Ahmad Hidayat, M.Kom.",
      class: "TI-2B",
      semester: "Ganjil",
      academicYear: "2025/2026",
      createdAt: new Date().toISOString(),
    },
    {
      id: "TI-1B-Tuesday-07:00-1",
      roomId: "TI-1B",
      day: "Tuesday",
      startTime: "07:00",
      endTime: "09:30",
      subject: "Algoritma dan Struktur Data",
      lecturer: "Dr. Siti Nurhaliza, M.T.",
      class: "TI-1A",
      semester: "Ganjil",
      academicYear: "2025/2026",
      createdAt: new Date().toISOString(),
    },
    {
      id: "TI-2A-Wednesday-13:00-1",
      roomId: "TI-2A",
      day: "Wednesday",
      startTime: "13:00",
      endTime: "15:30",
      subject: "Jaringan Komputer",
      lecturer: "Dr. Budi Santoso, M.T.",
      class: "TI-3A",
      semester: "Ganjil",
      academicYear: "2025/2026",
      createdAt: new Date().toISOString(),
    },
  ];

  for (const schedule of schedules) {
    try {
      await scheduleContainer.items.upsert(schedule);
      console.log(`✅ Created/Updated schedule: ${schedule.subject} - ${schedule.day}`);
    } catch (error) {
      console.error(`❌ Error creating schedule:`, error);
    }
  }
}

async function main() {
  console.log("🚀 Starting seed process...\n");

  try {
    await seedUsers();
    await seedRooms();
    await seedSchedules();

    console.log("\n✅ Seed process completed successfully!");
  } catch (error) {
    console.error("\n❌ Seed process failed:", error);
    process.exit(1);
  }
}

main();
