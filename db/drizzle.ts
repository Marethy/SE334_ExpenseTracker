import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Parse connection string từ environment
const getDatabaseUrl = () => {
  const url = process.env.DRIZZLE_DATABASE_URL;

  if (!url) {
    console.error("❌ DRIZZLE_DATABASE_URL is not set");
    throw new Error("Database URL is required");
  }

  console.log("🔌 Connecting to database:", url.replace(/:[^:@]*@/, ":***@"));
  return url;
};

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Add error handling
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

// Test connection
pool.on("connect", () => {
  console.log("✅ Database connected successfully");
});

export const db = drizzle(pool);
