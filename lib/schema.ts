import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";

export const STATUSES = ["working", "out_of_office"] as const;
export const LOCATIONS = ["CA", "NY", "other"] as const;

export type Status = (typeof STATUSES)[number];
export type Location = (typeof LOCATIONS)[number];

export const statusSchema = z.enum(STATUSES);
export const locationSchema = z.enum(LOCATIONS);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const dayEntries = sqliteTable("day_entries", {
  date: text("date").primaryKey(),
  status: text("status", { enum: STATUSES }).notNull(),
  location: text("location", { enum: LOCATIONS }),
  note: text("note"),
  updatedAt: integer("updated_at").notNull(),
});

export type DayEntry = typeof dayEntries.$inferSelect;

export const upsertRangeSchema = z.object({
  from: dateSchema,
  to: dateSchema,
  status: statusSchema,
  location: locationSchema.nullable().optional(),
  note: z.string().nullable().optional(),
});

export type UpsertRangePayload = z.infer<typeof upsertRangeSchema>;

export const rangeQuerySchema = z.object({
  from: dateSchema,
  to: dateSchema,
});
