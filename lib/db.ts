import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Sql = ReturnType<typeof postgres>;
type DB = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  _sql?: Sql;
  _db?: DB;
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
