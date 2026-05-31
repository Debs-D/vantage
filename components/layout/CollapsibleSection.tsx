"use client";

import { ReactNode, useState } from "react";

// A titled, collapsible block used for the secondary sidebar sections (presets,
// history). The schema browser stays always-open as the primary section.
export function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t shrink-0" style={{ borderColor: "var(--border)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full h-8 px-3 flex items-center justify-between
          hover:bg-[var(--surface-raised)] transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
      >
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block text-[8px] transition-transform"
            style={{ transform: open ? "none" : "rotate(-90deg)", color: "var(--text-muted)" }}
          >
            ▶
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            {title}
          </span>
        </span>
        {count !== undefined && (
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {count}
          </span>
        )}
      </button>
      {open && <div className="max-h-44 overflow-y-auto px-2 pb-2">{children}</div>}
    </div>
  );
}
