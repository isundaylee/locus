"use client";

import * as Popover from "@radix-ui/react-popover";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { LOCATIONS, STATUSES, type Location, type Status } from "@/lib/schema";

type Anchor = { x: number; y: number };

export function RangeEditPopover({
  open,
  anchor,
  from,
  to,
  initial,
  onOpenChange,
  onCommitted,
}: {
  open: boolean;
  anchor: Anchor | null;
  from: string;
  to: string;
  initial?: {
    status?: Status | null;
    location?: Location | null;
    note?: string | null;
  };
  onOpenChange: (open: boolean) => void;
  onCommitted: () => void;
}) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>(initial?.status ?? "working");
  const [location, setLocation] = useState<Location | "none">(
    initial?.location ?? "CA",
  );
  const [note, setNote] = useState<string>(initial?.note ?? "");

  useEffect(() => {
    if (open) {
      setStatus(initial?.status ?? "working");
      setLocation(initial?.location ?? "CA");
      setNote(initial?.note ?? "");
    }
  }, [open, initial?.status, initial?.location, initial?.note]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/days", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          from,
          to,
          status,
          location: location === "none" ? null : location,
          note: note.trim() ? note.trim() : null,
        }),
      });
      if (!res.ok) throw new Error("save failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["days"] });
      onCommitted();
    },
  });

  const clear = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/days?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("clear failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["days"] });
      onCommitted();
    },
  });

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Anchor
        style={{
          position: "fixed",
          left: anchor?.x ?? 0,
          top: anchor?.y ?? 0,
          width: 1,
          height: 1,
          pointerEvents: "none",
        }}
      />
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={8}
          className="z-50 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="mb-3 text-sm font-medium">
            {from === to ? from : `${from} → ${to}`}
          </div>

          <div className="mb-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Status
            </div>
            <RadioGroup.Root
              value={status}
              onValueChange={(v) => setStatus(v as Status)}
              className="flex gap-2"
            >
              {STATUSES.map((s) => (
                <RadioGroup.Item
                  key={s}
                  value={s}
                  className={clsx(
                    "rounded-md border px-2 py-1 text-xs",
                    status === s
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                      : "border-zinc-300 dark:border-zinc-700",
                  )}
                >
                  {s === "working" ? "Working" : "Out of office"}
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
          </div>

          <div className="mb-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Location
            </div>
            <RadioGroup.Root
              value={location}
              onValueChange={(v) => setLocation(v as Location | "none")}
              className="flex gap-2"
            >
              {(["none", ...LOCATIONS] as const).map((l) => (
                <RadioGroup.Item
                  key={l}
                  value={l}
                  className={clsx(
                    "rounded-md border px-2 py-1 text-xs",
                    location === l
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                      : "border-zinc-300 dark:border-zinc-700",
                  )}
                >
                  {l === "none" ? "—" : l}
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
          </div>

          <div className="mb-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Note
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Optional"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => clear.mutate()}
              disabled={clear.isPending}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Clear range
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {save.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
