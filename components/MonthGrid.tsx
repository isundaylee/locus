"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  deriveDay,
  expandRange,
  toDateStr,
  type DerivedDay,
  type MonthGridRange,
} from "@/lib/dates";
import type { DayEntry } from "@/lib/schema";
import { DayCell } from "./DayCell";
import { RangeEditPopover } from "./RangeEditPopover";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function inRange(d: string, a: string, b: string) {
  const lo = a <= b ? a : b;
  const hi = a <= b ? b : a;
  return d >= lo && d <= hi;
}

export function MonthGrid({
  year,
  month,
  grid,
  entries,
  loading,
}: {
  year: number;
  month: number;
  grid: MonthGridRange;
  entries: DayEntry[];
  loading: boolean;
}) {
  const today = toDateStr(new Date());

  const entryMap = useMemo(() => {
    const m = new Map<string, DayEntry>();
    for (const e of entries) m.set(e.date, e);
    return m;
  }, [entries]);

  const gridDates = useMemo(
    () => expandRange(grid.gridStart, grid.gridEnd),
    [grid.gridStart, grid.gridEnd],
  );

  const derived: DerivedDay[] = useMemo(
    () => gridDates.map((d) => deriveDay(d, entryMap.get(d))),
    [gridDates, entryMap],
  );

  const [anchor, setAnchor] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [committed, setCommitted] = useState<{
    from: string;
    to: string;
    initial?: {
      status?: DerivedDay["status"];
      location?: DerivedDay["location"];
      note?: string | null;
    };
    anchorXY: { x: number; y: number } | null;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  const commitSelection = useCallback(
    (fromDate: string, toDate: string, pointerXY: { x: number; y: number }) => {
      const [from, to] = fromDate <= toDate ? [fromDate, toDate] : [toDate, fromDate];
      const a = entryMap.get(from);
      const initial = a
        ? { status: a.status, location: a.location ?? null, note: a.note ?? null }
        : undefined;
      setCommitted({ from, to, initial, anchorXY: pointerXY });
    },
    [entryMap],
  );

  // window-level pointerup so leaving the grid mid-drag still commits.
  useEffect(() => {
    if (!dragging) return;
    function onUp(e: PointerEvent) {
      setDragging(false);
      if (anchor && hover) {
        commitSelection(anchor, hover, { x: e.clientX, y: e.clientY });
      }
    }
    function onMove(e: PointerEvent) {
      // when leaving the grid, freeze hover at last in-grid cell (no-op here).
      void e;
    }
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
    };
  }, [dragging, anchor, hover, commitSelection]);

  const onCellDown = useCallback(
    (date: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.shiftKey && anchor) {
        commitSelection(anchor, date, { x: e.clientX, y: e.clientY });
        return;
      }
      setAnchor(date);
      setHover(date);
      setDragging(true);
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    },
    [anchor, commitSelection],
  );

  const onCellEnter = useCallback(
    (date: string) => () => {
      if (dragging) setHover(date);
    },
    [dragging],
  );

  const onPopoverChange = (open: boolean) => {
    if (!open) {
      setCommitted(null);
      setAnchor(null);
      setHover(null);
    }
  };

  const monthLabel = format(new Date(year, month - 1, 1), "MMMM");

  return (
    <section className="relative rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-2 text-sm font-semibold">{monthLabel}</h3>
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-zinc-500">
        {WEEKDAY_LABELS.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <div
        ref={gridRef}
        className="grid grid-cols-7 gap-0.5"
        style={{ touchAction: "none" }}
      >
        {derived.map((d) => {
          const dt = new Date(d.date + "T00:00:00");
          const inMonth = dt.getMonth() + 1 === month && dt.getFullYear() === year;
          const isSelected =
            (dragging && anchor && hover && inRange(d.date, anchor, hover)) ||
            (committed && inRange(d.date, committed.from, committed.to));
          return (
            <DayCell
              key={d.date}
              day={d}
              inCurrentMonth={inMonth}
              isToday={d.date === today}
              isSelected={Boolean(isSelected)}
              onPointerDown={onCellDown(d.date)}
              onPointerEnter={onCellEnter(d.date)}
            />
          );
        })}
      </div>
      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-2 text-xs text-zinc-500">
          loading…
        </div>
      )}

      <RangeEditPopover
        open={committed !== null}
        anchor={committed?.anchorXY ?? null}
        from={committed?.from ?? ""}
        to={committed?.to ?? ""}
        initial={committed?.initial}
        onOpenChange={onPopoverChange}
        onCommitted={() => onPopoverChange(false)}
      />
    </section>
  );
}
