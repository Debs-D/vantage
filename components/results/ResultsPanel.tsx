"use client";

import { useMemo, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { useQueryStore } from "@/lib/store/query-store";
import { useResultsStore } from "@/lib/store/results-store";
import { SCHEMAS, fieldTypesOf } from "@/lib/schema/schemas";
import { validateTree } from "@/lib/query/validator";
import { SchemaDefinition } from "@/lib/schema/types";

type Row = Record<string, unknown>;

export function ResultsPanel() {
  const schemaKey = useQueryStore((s) => s.activeSchemaKey);
  const tree = useQueryStore((s) => s.tree);
  const schema = SCHEMAS[schemaKey];

  const status = useResultsStore((s) => s.status);
  const rows = useResultsStore((s) => s.rows);
  const error = useResultsStore((s) => s.error);
  const execute = useResultsStore((s) => s.execute);

  // An empty group ("match all") is runnable; any other validation error blocks
  // execution, so the button is disabled with an explanatory tooltip.
  const blocking = useMemo(
    () => validateTree(tree, fieldTypesOf(schema)).filter((e) => e.type !== "empty-group"),
    [tree, schema]
  );
  const disabled = status === "running" || blocking.length > 0;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="h-8 px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Results
          </span>
          {status === "done" && <Badge variant="coral">{rows.length}</Badge>}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={execute}
          disabled={disabled}
          title={
            blocking.length > 0
              ? `Resolve ${blocking.length} issue${blocking.length === 1 ? "" : "s"} to run`
              : "Execute query (Ctrl+Enter)"
          }
        >
          {status === "running" ? "Running…" : "Execute"}
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-3 pb-3">
        {status === "error" ? (
          <Message tone="error">Can&apos;t run: {error}</Message>
        ) : status === "running" ? (
          <Message>Running query…</Message>
        ) : status === "idle" ? (
          <Message>Execute the query to see matching records.</Message>
        ) : rows.length === 0 ? (
          <Message>No records match this query.</Message>
        ) : (
          <ul className="flex flex-col gap-1.5 animate-fade-in">
            {rows.map((row, i) => (
              <ResultCard key={i} row={row} schema={schema} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ResultCard({ row, schema }: { row: Row; schema: SchemaDefinition }) {
  const [expanded, setExpanded] = useState(false);
  const fields = schema.fields;
  const shown = expanded ? fields : fields.slice(0, 3);

  return (
    <li
      className="cv-auto rounded border p-2"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex flex-col gap-1 text-left"
        aria-expanded={expanded}
      >
        {shown.map((field) => (
          <div key={field.key} className="flex items-baseline gap-2 text-xs">
            <span
              className="w-24 shrink-0 truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {field.label}
            </span>
            <span className="font-mono truncate" style={{ color: "var(--text)" }}>
              {String(row[field.key])}
            </span>
          </div>
        ))}
      </button>
      {!expanded && fields.length > 3 && (
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          +{fields.length - 3} more
        </span>
      )}
    </li>
  );
}

function Message({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <p
        className="text-xs text-center max-w-[240px]"
        style={{ color: tone === "error" ? "#dc2626" : "var(--text-muted)" }}
      >
        {children}
      </p>
    </div>
  );
}
