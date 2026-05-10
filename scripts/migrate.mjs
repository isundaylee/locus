// Apply pending drizzle migrations and exit. Intended for Helm pre-upgrade /
// pre-install Job so app pods never have to race on migration in multi-replica
// deployments. Idempotent — drizzle's migrator tracks applied migrations in
// __drizzle_migrations.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const migrationsFolder = process.env.DRIZZLE_MIGRATIONS_FOLDER ?? "./drizzle";

const client = postgres(url, { max: 1 });
try {
  await migrate(drizzle(client), { migrationsFolder });
  console.log("migrations applied");
} catch (e) {
  console.error("migration failed:", e);
  process.exitCode = 1;
} finally {
  await client.end();
}
