"use client";

import { useQueryStore } from "@/lib/store/query-store";
import { countConditions } from "@/lib/query/tree";

export function BuilderToolbar() {
  const tree = useQueryStore((s) => s.tree);
  const canUndo = useQueryStore((s) => s.history.length > 0);
  const canRedo = useQueryStore((s) => s.future.length > 0);
  const undo = useQueryStore((s) => s.undo);
  const redo = useQueryStore((s) => s.redo);
  const clear = useQueryStore((s) => s.clear);

  const conditions = countConditions(tree);

  return (
    <div className="flex items-center gap-3">
      <span
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        Query Builder
      </span>
      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        {conditions} condition{conditions === 1 ? "" : "s"}
      </span>

      <div className="flex-1" />

      <ToolbarButton onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        Undo
      </ToolbarButton>
      <ToolbarButton onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
        Redo
      </ToolbarButton>
      <ToolbarButton onClick={clear} disabled={tree.children.length === 0} title="Clear all conditions">
        Clear
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="px-2 h-6 rounded text-[11px] text-[var(--text-secondary)]
        hover:bg-[var(--surface-raised)] hover:text-[var(--text)] transition-colors
        disabled:opacity-30 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
    >
      {children}
    </button>
  );
}
