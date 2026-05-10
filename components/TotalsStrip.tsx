"use client";

import { useMemo } from "react";
import { deriveDay, expandRange, tallyDays } from "@/lib/dates";
import type { DayEntry } from "@/lib/schema";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function TotalsStrip({
  year,
  entries,
  loading,
}: {
  year: number;
  entries: DayEntry[];
  loading: boolean;
}) {
  const totals = useMemo(() => {
    const map = new Map<string, DayEntry>();
    for (const e of entries) map.set(e.date, e);
    const days = expandRange(`${year}-01-01`, `${year}-12-31`).map((d) =>
      deriveDay(d, map.get(d)),
    );
    return tallyDays(days);
  }, [year, entries]);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {year} YTD
      </h2>
      <div className="flex flex-wrap items-stretch gap-6">
        <div className="flex gap-6">
          <Stat label="Working" value={loading ? "…" : totals.working} />
          <Stat label="OOO" value={loading ? "…" : totals.out_of_office} />
        </div>
        <div
          aria-hidden
          className="w-px self-stretch bg-zinc-200 dark:bg-zinc-800"
        />
        <div className="flex gap-6">
          <Stat label="CA" value={loading ? "…" : totals.CA} />
          <Stat label="NY" value={loading ? "…" : totals.NY} />
          <Stat label="Other" value={loading ? "…" : totals.other} />
        </div>
      </div>
    </section>
  );
}
