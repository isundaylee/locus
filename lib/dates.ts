import {
  addDays,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfMonth,
} from "date-fns";
import type { DayEntry, Location, Status } from "./schema";

export type DateStr = string;

export function toDateStr(d: Date): DateStr {
  return format(d, "yyyy-MM-dd");
}

export function fromDateStr(s: DateStr): Date {
  return parseISO(s);
}

export function isWeekend(s: DateStr): boolean {
  const dow = getDay(parseISO(s));
  return dow === 0 || dow === 6;
}

export function expandRange(from: DateStr, to: DateStr): DateStr[] {
  const start = parseISO(from);
  const end = parseISO(to);
  const [lo, hi] = start <= end ? [start, end] : [end, start];
  const out: DateStr[] = [];
  for (let d = lo; d <= hi; d = addDays(d, 1)) {
    out.push(toDateStr(d));
  }
  return out;
}

export type DerivedDay = {
  date: DateStr;
  status: Status | null;
  location: Location | null;
  note: string | null;
  isDefault: boolean;
};

export function deriveDay(
  date: DateStr,
  entry: DayEntry | undefined,
): DerivedDay {
  if (entry) {
    return {
      date,
      status: entry.status,
      location: entry.location ?? null,
      note: entry.note ?? null,
      isDefault: false,
    };
  }
  if (isWeekend(date)) {
    return {
      date,
      status: "out_of_office",
      location: "CA",
      note: null,
      isDefault: true,
    };
  }
  return {
    date,
    status: "working",
    location: "CA",
    note: null,
    isDefault: true,
  };
}

export type MonthGridRange = {
  gridStart: DateStr;
  gridEnd: DateStr;
  monthStart: DateStr;
  monthEnd: DateStr;
};

// 6-row grid starting Sunday that covers a given (year, month, 1-12).
export function monthGridRange(year: number, month: number): MonthGridRange {
  const first = startOfMonth(new Date(year, month - 1, 1));
  const last = endOfMonth(first);
  const leading = getDay(first); // 0..6 Sun..Sat
  const gridStart = addDays(first, -leading);
  const gridEnd = addDays(gridStart, 41); // 6 rows * 7 cols - 1
  return {
    gridStart: toDateStr(gridStart),
    gridEnd: toDateStr(gridEnd),
    monthStart: toDateStr(first),
    monthEnd: toDateStr(last),
  };
}

export type Totals = {
  working: number;
  out_of_office: number;
  CA: number;
  NY: number;
  other: number;
};

export function emptyTotals(): Totals {
  return {
    working: 0,
    out_of_office: 0,
    CA: 0,
    NY: 0,
    other: 0,
  };
}

export function tallyDays(days: DerivedDay[]): Totals {
  const t = emptyTotals();
  for (const d of days) {
    if (d.status === "working") t.working += 1;
    else if (d.status === "out_of_office") t.out_of_office += 1;
    if (d.location === "CA") t.CA += 1;
    else if (d.location === "NY") t.NY += 1;
    else if (d.location === "other") t.other += 1;
  }
  return t;
}

export function todayInBrowser(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
