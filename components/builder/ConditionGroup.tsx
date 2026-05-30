"use client";

import { ConditionRule } from "./ConditionRule";
import { useNode, useQueryTree } from "@/hooks/use-query-tree";
import { LogicOperator } from "@/lib/query/types";

// The colored left bar deepens with nesting depth, giving an at-a-glance sense
// of how far down a group sits.
function barColor(depth: number): string {
  const alpha = Math.min(0.25 + depth * 0.2, 0.85);
  return `rgba(229, 83, 26, ${alpha})`;
}

function LogicToggle({
  logic,
  onChange,
}: {
  logic: LogicOperator;
  onChange: (logic: LogicOperator) => void;
}) {
  return (
    <div
      className="inline-flex rounded border overflow-hidden"
      style={{ borderColor: "var(--border)" }}
      role="group"
      aria-label="Match logic"
    >
      {(["AND", "OR"] as const).map((option) => {
        const active = logic === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={active}
            className={`px-2.5 h-6 text-[11px] font-semibold tracking-wide transition-colors ${
              active
                ? "bg-coral text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function ConditionGroup({
  nodeId,
  depth,
}: {
  nodeId: string;
  depth: number;
}) {
  const node = useNode(nodeId);
  const {
    addCondition,
    addGroup,
    removeNode,
    updateGroupLogic,
    toggleCollapse,
  } = useQueryTree();

  if (!node || node.type !== "group") return null;
  const group = node;
  const isRoot = depth === 0;
  const collapsed = group.collapsed ?? false;

  return (
    <div
      className={isRoot ? "" : "rounded-r animate-slide-in"}
      style={
        isRoot
          ? undefined
          : {
              borderLeft: `3px solid ${barColor(depth)}`,
              background: "var(--surface-raised)",
            }
      }
    >
      {/* Group toolbar */}
      <div
        className={`flex items-center gap-2 ${isRoot ? "pb-2" : "px-2 py-1.5"}`}
      >
        <button
          type="button"
          onClick={() => toggleCollapse(group.id)}
          aria-label={collapsed ? "Expand group" : "Collapse group"}
          aria-expanded={!collapsed}
          className="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)]
            hover:bg-[var(--surface-raised)] hover:text-[var(--text)] transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
        >
          <span
            className="inline-block transition-transform"
            style={{ transform: collapsed ? "rotate(-90deg)" : "none" }}
          >
            ▾
          </span>
        </button>

        <LogicToggle
          logic={group.logic}
          onChange={(logic) => updateGroupLogic(group.id, logic)}
        />

        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {group.children.length} item{group.children.length === 1 ? "" : "s"}
        </span>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => addCondition(group.id)}
          className="px-2 h-6 rounded text-xs border border-[var(--border)] text-[var(--text-secondary)]
            hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
        >
          + Condition
        </button>
        <button
          type="button"
          onClick={() => addGroup(group.id)}
          className="px-2 h-6 rounded text-xs border border-[var(--border)] text-[var(--text-secondary)]
            hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
        >
          + Group
        </button>
        {!isRoot && (
          <button
            type="button"
            onClick={() => removeNode(group.id)}
            aria-label="Remove group"
            title="Remove group"
            className="w-6 h-6 flex items-center justify-center rounded
              text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
          >
            ×
          </button>
        )}
      </div>

      {/* Children */}
      {!collapsed && (
        <div className={`flex flex-col gap-1.5 ${isRoot ? "" : "px-2 pb-2"}`}>
          {group.children.length === 0 ? (
            <p
              className="text-xs italic px-1 py-1"
              style={{ color: "var(--text-muted)" }}
            >
              Empty group — add a condition or nested group.
            </p>
          ) : (
            group.children.map((child) =>
              child.type === "group" ? (
                <ConditionGroup key={child.id} nodeId={child.id} depth={depth + 1} />
              ) : (
                <ConditionRule key={child.id} nodeId={child.id} />
              )
            )
          )}
        </div>
      )}
    </div>
  );
}
