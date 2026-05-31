"use client";

import { useUIStore } from "@/lib/store/ui-store";

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "Ctrl + Z", action: "Undo" },
  { keys: "Ctrl + Shift + Z", action: "Redo" },
  { keys: "Ctrl + Enter", action: "Execute query" },
  { keys: "Ctrl + S", action: "Save as preset" },
  { keys: "Ctrl + E", action: "Export query" },
  { keys: "?", action: "Toggle this help" },
];

export function ShortcutsModal() {
  const open = useUIStore((s) => s.shortcutsOpen);
  const close = useUIStore((s) => s.setShortcutsOpen);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={() => close(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="w-full max-w-sm rounded-lg border shadow-xl"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-4 h-10 flex items-center justify-between border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Keyboard shortcuts
          </span>
          <button
            type="button"
            onClick={() => close(false)}
            aria-label="Close"
            className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)]
              hover:bg-[var(--surface-raised)] hover:text-[var(--text)] transition-colors"
          >
            ×
          </button>
        </div>
        <ul className="p-2">
          {SHORTCUTS.map((s) => (
            <li
              key={s.keys}
              className="flex items-center justify-between px-2 h-9 text-sm"
            >
              <span style={{ color: "var(--text-secondary)" }}>{s.action}</span>
              <kbd
                className="px-1.5 py-0.5 rounded border font-mono text-[11px]"
                style={{
                  background: "var(--surface-raised)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
