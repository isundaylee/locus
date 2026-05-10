import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { join } from "node:path";
import * as schema from "./schema";

type Sql = ReturnType<typeof postgres>;
type DB = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  _sql?: Sql;
  _db?: DB;
  _schemaReady?: Promise<void>;
};

const MIGRATIONS_FOLDER =
  process.env.DRIZZLE_MIGRATIONS_FOLDER ?? join(process.cwd(), "drizzle");

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
  globalForDb._schemaReady = (async () => {
    // Use a dedicated single-connection client for migrations, per the
    // drizzle recommendation.
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is required");
    const migrationClient = postgres(url, { max: 1 });
    try {
      await migrate(drizzle(migrationClient), {
        migrationsFolder: MIGRATIONS_FOLDER,
      });
    } finally {
      await migrationClient.end();
    }
  })().catch((e) => {
    console.error("migration failed:", e);
    globalForDb._schemaReady = undefined;
    throw e;
  });
  return globalForDb._schemaReady;
}
