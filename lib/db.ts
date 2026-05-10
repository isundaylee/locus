import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
  ensured?: Promise<void>;
};

const sql =
  globalForDb.sql ??
  postgres(DATABASE_URL, {
    max: 5,
    idle_timeout: 30,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
}

async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS day_entries (
      date        text PRIMARY KEY,
      status      text NOT NULL CHECK (status IN ('working', 'out_of_office')),
      location    text CHECK (location IS NULL OR location IN ('CA', 'NY', 'other')),
      note        text,
      updated_at  bigint NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_day_entries_date ON day_entries(date)`;
}

export const schemaReady: Promise<void> =
  globalForDb.ensured ??
  ensureSchema().catch((e) => {
    console.error("schema init failed:", e);
    throw e;
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.ensured = schemaReady;
}

export const db = drizzle(sql, { schema });
export { sql };
