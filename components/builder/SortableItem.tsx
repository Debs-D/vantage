"use client";

import { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden>
      <circle cx="2" cy="2" r="1.3" />
      <circle cx="8" cy="2" r="1.3" />
      <circle cx="2" cy="7" r="1.3" />
      <circle cx="8" cy="7" r="1.3" />
      <circle cx="2" cy="12" r="1.3" />
      <circle cx="8" cy="12" r="1.3" />
    </svg>
  );
}

// Wraps one tree node (condition or group) as a sortable row. The drag handle
// lives here — the only element wired to the pointer/keyboard sensors — so the
// node components stay free of drag concerns and selects/buttons stay clickable.
export function SortableItem({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="flex items-start gap-1"
    >
      <button
        type="button"
        className="shrink-0 mt-1.5 px-0.5 py-1 rounded cursor-grab touch-none
          text-[var(--text-muted)] opacity-30 hover:opacity-80 transition-opacity
          focus-visible:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
