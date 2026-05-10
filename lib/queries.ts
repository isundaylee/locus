import { and, gte, lte } from "drizzle-orm";
import { db, sqlite } from "./db";
import { dayEntries, type DayEntry, type Location, type Status } from "./schema";
import { expandRange } from "./dates";

export function getRange(from: string, to: string): DayEntry[] {
  return db
    .select()
    .from(dayEntries)
    .where(and(gte(dayEntries.date, from), lte(dayEntries.date, to)))
    .all();
}

export type UpsertInput = {
  from: string;
  to: string;
  status: Status;
  location: Location | null;
  note: string | null;
};

export function upsertRange(input: UpsertInput): number {
  const dates = expandRange(input.from, input.to);
  const now = Date.now();
  const tx = sqlite.transaction((rows: typeof dates) => {
    const stmt = sqlite.prepare(
      `INSERT INTO day_entries (date, status, location, note, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         status = excluded.status,
         location = excluded.location,
         note = excluded.note,
         updated_at = excluded.updated_at`,
    );
    for (const d of rows) {
      stmt.run(d, input.status, input.location, input.note, now);
    }
  });
  tx(dates);
  return dates.length;
}

export function deleteRange(from: string, to: string): number {
  const dates = expandRange(from, to);
  const tx = sqlite.transaction((rows: typeof dates) => {
    const stmt = sqlite.prepare(`DELETE FROM day_entries WHERE date = ?`);
    let n = 0;
    for (const d of rows) {
      const info = stmt.run(d);
      n += info.changes;
    }
    return n;
  });
  return tx(dates) as unknown as number;
}
