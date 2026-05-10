"use client";

import clsx from "clsx";
import { format, parseISO } from "date-fns";
import type { DerivedDay } from "@/lib/dates";

const STATUS_BG: Record<string, string> = {
  working: "bg-emerald-100 dark:bg-emerald-900/40",
  out_of_office: "bg-amber-100 dark:bg-amber-900/40",
};

const LOCATION_BADGE: Record<string, string> = {
  CA: "bg-sky-200 text-sky-900 dark:bg-sky-700 dark:text-sky-100",
  NY: "bg-violet-200 text-violet-900 dark:bg-violet-700 dark:text-violet-100",
  other: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
};

export type DayCellProps = {
  day: DerivedDay;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerEnter: (e: React.PointerEvent<HTMLButtonElement>) => void;
};

export function DayCell({
  day,
  inCurrentMonth,
  isToday,
  isSelected,
  onPointerDown,
  onPointerEnter,
}: DayCellProps) {
  const d = parseISO(day.date);
  const num = format(d, "d");

  return (
    <button
      type="button"
      data-date={day.date}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      className={clsx(
        "relative flex aspect-square select-none items-center justify-center rounded border text-[11px] transition-colors",
        inCurrentMonth
          ? "border-zinc-200 dark:border-zinc-800"
          : "border-transparent text-zinc-400 opacity-40 dark:text-zinc-600",
        day.status && STATUS_BG[day.status],
        day.isDefault && "border-dashed",
        isSelected && "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-900",
        isToday && "outline outline-2 outline-blue-400",
      )}
      title={
        day.note
          ? `${day.date}${day.location ? " · " + day.location : ""} — ${day.note}`
          : day.location
            ? `${day.date} · ${day.location}`
            : day.date
      }
    >
      <span
        className={clsx(
          "leading-none",
          isToday && "font-semibold text-blue-700 dark:text-blue-300",
        )}
      >
        {num}
      </span>
      {day.location && (
        <span
          className={clsx(
            "absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full",
            LOCATION_BADGE[day.location],
          )}
        />
      )}
      {day.note && (
        <span className="absolute right-0.5 top-0.5 h-1 w-1 rounded-full bg-zinc-500" />
      )}
    </button>
  );
}
