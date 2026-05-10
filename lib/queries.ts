import { and, gte, lte, sql as drizzleSql } from "drizzle-orm";
import { getDb } from "./db";
import { dayEntries, type DayEntry, type Location, type Status } from "./schema";
import { expandRange } from "./dates";

export async function getRange(from: string, to: string): Promise<DayEntry[]> {
  return getDb()
    .select()
    .from(dayEntries)
    .where(and(gte(dayEntries.date, from), lte(dayEntries.date, to)));
}

export type UpsertInput = {
  from: string;
  to: string;
  status: Status;
  location: Location | null;
  note: string | null;
};

export async function upsertRange(input: UpsertInput): Promise<number> {
  const dates = expandRange(input.from, input.to);
  if (dates.length === 0) return 0;
  const now = Date.now();
  const rows = dates.map((date) => ({
    date,
    status: input.status,
    location: input.location,
    note: input.note,
    updatedAt: now,
  }));

  await getDb()
    .insert(dayEntries)
    .values(rows)
    .onConflictDoUpdate({
      target: dayEntries.date,
      set: {
        status: drizzleSql`excluded.status`,
        location: drizzleSql`excluded.location`,
        note: drizzleSql`excluded.note`,
        updatedAt: drizzleSql`excluded.updated_at`,
      },
    });

  return rows.length;
}

export async function deleteRange(from: string, to: string): Promise<number> {
  const result = await getDb()
    .delete(dayEntries)
    .where(and(gte(dayEntries.date, from), lte(dayEntries.date, to)))
    .returning({ date: dayEntries.date });
  return result.length;
}
