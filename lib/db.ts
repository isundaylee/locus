import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema";

const DATABASE_PATH = process.env.DATABASE_PATH ?? "./data/locus.db";

function ensureSchema(conn: Database.Database) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS day_entries (
      date        TEXT PRIMARY KEY,
      status      TEXT NOT NULL CHECK (status IN ('working', 'out_of_office')),
      location    TEXT CHECK (location IS NULL OR location IN ('CA', 'NY', 'other')),
      note        TEXT,
      updated_at  INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_day_entries_date ON day_entries(date);
  `);
}

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
};

const sqlite =
  globalForDb.sqlite ??
  (() => {
    mkdirSync(dirname(DATABASE_PATH), { recursive: true });
    const conn = new Database(DATABASE_PATH);
    conn.pragma("journal_mode = WAL");
    conn.pragma("foreign_keys = ON");
    ensureSchema(conn);
    return conn;
  })();

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { sqlite };
