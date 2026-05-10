CREATE TABLE "day_entries" (
	"date" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"location" text,
	"note" text,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "status_valid" CHECK ("day_entries"."status" IN ('working', 'out_of_office')),
	CONSTRAINT "location_valid" CHECK ("day_entries"."location" IS NULL OR "day_entries"."location" IN ('CA', 'NY', 'other'))
);
