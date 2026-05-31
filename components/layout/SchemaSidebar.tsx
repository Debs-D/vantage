"use client";

import { Badge } from "@/components/ui";
import { useQueryStore } from "@/lib/store/query-store";
import { SCHEMAS } from "@/lib/schema/schemas";
import { FieldType } from "@/lib/query/types";
import { PresetsSection } from "./PresetsSection";
import { HistorySection } from "./HistorySection";

// Each field type gets a stable, low-key badge color so the sidebar doubles as
// schema documentation at a glance.
const typeBadge: Record<FieldType, "default" | "coral" | "success" | "warning"> = {
  string: "default",
  number: "coral",
  boolean: "success",
  enum: "warning",
  date: "default",
};

export function SchemaSidebar() {
  const schemaKey = useQueryStore((s) => s.activeSchemaKey);
  const rootId = useQueryStore((s) => s.tree.id);
  const addCondition = useQueryStore((s) => s.addCondition);

  const schema = SCHEMAS[schemaKey];

  return (
    <aside
      className="w-52 shrink-0 border-r flex flex-col overflow-hidden"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div
        className="h-8 px-3 flex items-center justify-between shrink-0 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          {schema.label}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {schema.fields.length} fields
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        <p
          className="px-1 pb-2 text-[10px] leading-tight"
          style={{ color: "var(--text-muted)" }}
        >
          Click a field to add a condition.
        </p>
        <ul className="flex flex-col gap-0.5">
          {schema.fields.map((field) => (
            <li key={field.key}>
              <button
                type="button"
                onClick={() => addCondition(rootId, field.key)}
                className="group w-full flex items-center justify-between gap-2 px-2 h-7 rounded text-left
                  transition-colors duration-100
                  hover:bg-[var(--surface-raised)]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
              >
                <span className="text-xs truncate" style={{ color: "var(--text)" }}>
                  {field.label}
                </span>
                <Badge variant={typeBadge[field.type]}>{field.type}</Badge>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <PresetsSection />
      <HistorySection />
    </aside>
  );
}
