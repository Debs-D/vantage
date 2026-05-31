"use client";

import { CollapsibleSection } from "./CollapsibleSection";
import { useQueryStore } from "@/lib/store/query-store";
import { countConditions } from "@/lib/query/tree";

// Lists the undo snapshots (most recent first). Clicking one restores it as the
// current query — itself an undoable edit, since restore routes through commit.
export function HistorySection() {
  const history = useQueryStore((s) => s.history);
  const restore = useQueryStore((s) => s.restore);

  // Newest first; index back into the original array for the restore call.
  const entries = history.map((tree, i) => ({ tree, i })).reverse();

  return (
    <CollapsibleSection title="History" count={history.length}>
      {history.length === 0 ? (
        <p className="text-[11px] px-1 py-1" style={{ color: "var(--text-muted)" }}>
          Edits you make will be listed here.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {entries.map(({ tree, i }) => {
            const conditions = countConditions(tree);
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => restore(tree)}
                  className="w-full flex items-center justify-between gap-2 px-2 h-7 rounded text-left
                    hover:bg-[var(--surface-raised)] transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
                >
                  <span className="text-xs" style={{ color: "var(--text)" }}>
                    Step {i + 1}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {conditions} condition{conditions === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </CollapsibleSection>
  );
}
