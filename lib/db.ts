import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Sql = ReturnType<typeof postgres>;
type DB = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  _sql?: Sql;
  _db?: DB;
  _schemaReady?: Promise<void>;
};

function getSql(): Sql {
  if (globalForDb._sql) return globalForDb._sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  const sql = postgres(url, {
    max: 5,
    idle_timeout: 30,
    prepare: false,
  });
  globalForDb._sql = sql;
  return sql;
}

export function getDb(): DB {
  if (globalForDb._db) return globalForDb._db;
  globalForDb._db = drizzle(getSql(), { schema });
  return globalForDb._db;
}

export function schemaReady(): Promise<void> {
  if (globalForDb._schemaReady) return globalForDb._schemaReady;
  const sql = getSql();
  globalForDb._schemaReady = (async () => {
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
  })().catch((e) => {
    console.error("schema init failed:", e);
    // Reset so the next caller retries instead of being stuck on a poisoned promise.
    globalForDb._schemaReady = undefined;
    throw e;
  });
  return globalForDb._schemaReady;
}
