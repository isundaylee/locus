"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { monthGridRange } from "@/lib/dates";
import type { DayEntry } from "@/lib/schema";
import { MonthGrid } from "./MonthGrid";
import { TotalsStrip } from "./TotalsStrip";

async function fetchDays(from: string, to: string): Promise<DayEntry[]> {
  const res = await fetch(
    `/api/days?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Failed to load days");
  const data = (await res.json()) as { days: DayEntry[] };
  return data.days;
}

export function YearView({ year }: { year: number }) {
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        grid: monthGridRange(year, i + 1),
      })),
    [year],
  );

  // One query covers all 12 month-grids (incl. overflow into Dec/Jan).
  const fetchFrom = `${year - 1}-12-01`;
  const fetchTo = `${year + 1}-01-31`;

  const yearQuery = useQuery({
    queryKey: ["days", year, "full"],
    queryFn: () => fetchDays(fetchFrom, fetchTo),
  });

  const entries = yearQuery.data ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link
          href={`/calendar/${year - 1}`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ← {year - 1}
        </Link>
        <h1 className="text-2xl font-semibold">{year}</h1>
        <Link
          href={`/calendar/${year + 1}`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {year + 1} →
        </Link>
      </header>

      <TotalsStrip year={year} entries={entries} loading={yearQuery.isLoading} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map(({ month, grid }) => (
          <MonthGrid
            key={month}
            year={year}
            month={month}
            grid={grid}
            entries={entries}
            loading={yearQuery.isLoading}
          />
        ))}
      </div>
    </main>
  );
}
