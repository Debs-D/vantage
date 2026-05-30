"use client";

import { SchemaSidebar } from "./SchemaSidebar";
import { useQueryStore } from "@/lib/store/query-store";
import { SCHEMAS, findField } from "@/lib/schema/schemas";
import { OPERATOR_DEFS } from "@/lib/schema/operators";
import { Badge } from "@/components/ui";
import { QueryNode } from "@/lib/query/types";

// Center-panel preview of the query. This is a read-only reflection that proves
// the store wiring end to end; the interactive recursive builder replaces it in
// the next step.
function describe(node: QueryNode, schemaKey: string): string {
  if (node.type === "group") {
    return `( ${node.children.length} item${node.children.length === 1 ? "" : "s"}, ${node.logic} )`;
  }
  const label = findField(SCHEMAS[schemaKey], node.field)?.label ?? "—";
  const operator = OPERATOR_DEFS[node.operator]?.label ?? node.operator;
  const value =
    node.value === null || node.value === ""
      ? ""
      : Array.isArray(node.value)
        ? node.value.join(", ")
        : String(node.value);
  return `${label} ${operator} ${value}`.trim();
}

export function PanelLayout() {
  const tree = useQueryStore((s) => s.tree);
  const schemaKey = useQueryStore((s) => s.activeSchemaKey);

  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      {/* Left ── Schema Browser */}
      <SchemaSidebar />

      {/* Center ── Query Builder Canvas */}
      <main
        className="flex-1 flex flex-col overflow-hidden min-w-0"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="h-8 px-4 flex items-center shrink-0 border-b"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Query Builder
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {tree.children.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p
                className="text-sm text-center max-w-xs"
                style={{ color: "var(--text-muted)" }}
              >
                No conditions yet. Click a field in the schema sidebar to start
                building your query.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {tree.children.map((child) => (
                <li
                  key={child.id}
                  className="flex items-center gap-2 px-3 h-9 rounded border animate-slide-in"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  {child.type === "group" && <Badge variant="coral">group</Badge>}
                  <span
                    className="text-sm font-mono"
                    style={{ color: "var(--text)" }}
                  >
                    {describe(child, schemaKey)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Right ── Live Preview + Results */}
      <aside
        className="w-[360px] shrink-0 border-l flex flex-col overflow-hidden"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="h-8 px-3 flex items-center shrink-0 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Live Preview
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Query output will appear here.
          </p>
        </div>
      </aside>
    </div>
  );
}
