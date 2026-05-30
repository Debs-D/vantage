"use client";

import { useMemo, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { useQueryStore } from "@/lib/store/query-store";
import { SCHEMAS, fieldTypesOf } from "@/lib/schema/schemas";
import { DATASETS } from "@/lib/data/datasets";
import { executeQuery } from "@/lib/data/executor";
import { validateTree } from "@/lib/query/validator";
import { SchemaDefinition } from "@/lib/schema/types";

type Row = Record<string, unknown>;

export function ResultsPanel() {
  const tree = useQueryStore((s) => s.tree);
  const schemaKey = useQueryStore((s) => s.activeSchemaKey);
  const schema = SCHEMAS[schemaKey];

  const [results, setResults] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // An empty group means "no filter" (match all), which is fine to run. Other
  // validation errors would make execution meaningless, so they block it.
  const blocking = useMemo(
    () => validateTree(tree, fieldTypesOf(schema)).filter((e) => e.type !== "empty-group"),
    [tree, schema]
  );

  const execute = () => {
    if (blocking.length > 0) {
      setError(blocking[0].message);
      setResults(null);
      return;
    }
    setError(null);
    setLoading(true);
    // Brief delay so the loading state reads as a real round-trip.
    setTimeout(() => {
      const rows = executeQuery(tree, DATASETS[schemaKey], schema);
      setResults(rows);
      setLoading(false);
    }, 150);
  };

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
          {results && <Badge variant="coral">{results.length}</Badge>}
        </div>
        <Button variant="primary" size="sm" onClick={execute} disabled={loading}>
          {loading ? "Running…" : "Execute"}
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-3 pb-3">
        {error ? (
          <Message tone="error">Can&apos;t run: {error}</Message>
        ) : loading ? (
          <Message>Running query…</Message>
        ) : results === null ? (
          <Message>Execute the query to see matching records.</Message>
        ) : results.length === 0 ? (
          <Message>No records match this query.</Message>
        ) : (
          <ul className="flex flex-col gap-1.5 animate-fade-in">
            {results.map((row, i) => (
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
      className="rounded border p-2"
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
