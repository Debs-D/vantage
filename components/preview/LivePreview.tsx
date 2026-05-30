"use client";

import { ReactNode, useMemo, useState } from "react";
import { useQueryStore } from "@/lib/store/query-store";
import { useUIStore, type PreviewFormat } from "@/lib/store/ui-store";
import { SCHEMAS, fieldTypesOf } from "@/lib/schema/schemas";
import { toSQL } from "@/lib/query/serializers/sql";
import { toMongo } from "@/lib/query/serializers/mongo";
import { toJSON } from "@/lib/query/serializers/json";
import { validateTree } from "@/lib/query/validator";

const TABS: { key: PreviewFormat; label: string }[] = [
  { key: "sql", label: "SQL" },
  { key: "mongo", label: "MongoDB" },
  { key: "json", label: "JSON" },
];

export function LivePreview() {
  const tree = useQueryStore((s) => s.tree);
  const schemaKey = useQueryStore((s) => s.activeSchemaKey);
  const format = useUIStore((s) => s.previewFormat);
  const setFormat = useUIStore((s) => s.setPreviewFormat);
  const [copied, setCopied] = useState(false);

  const schema = SCHEMAS[schemaKey];

  // Recomputed only when the tree, schema, or format actually changes.
  const code = useMemo(() => {
    if (format === "sql") return toSQL(tree, schema);
    if (format === "mongo") return JSON.stringify(toMongo(tree, schema), null, 2);
    return toJSON(tree);
  }, [tree, schema, format]);

  const errors = useMemo(
    () => validateTree(tree, fieldTypesOf(schema)),
    [tree, schema]
  );

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 border-b" style={{ borderColor: "var(--border)" }}>
      {/* Header + tabs */}
      <div
        className="h-8 px-2 flex items-center justify-between shrink-0 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-0.5">
          {TABS.map((tab) => {
            const active = format === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFormat(tab.key)}
                aria-pressed={active}
                className={`px-2 h-6 rounded text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-coral/10 text-coral"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={copy}
          className="px-2 h-6 rounded text-[11px] text-[var(--text-secondary)]
            hover:bg-[var(--surface-raised)] hover:text-[var(--text)] transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Validation banner */}
      {errors.length > 0 && (
        <div
          className="px-3 py-1.5 text-[11px] border-b shrink-0"
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            borderColor: "var(--border)",
            color: "#b45309",
          }}
        >
          {errors.length} issue{errors.length === 1 ? "" : "s"}: {errors[0].message}
        </div>
      )}

      {/* Output */}
      <div className="flex-1 overflow-auto p-3">
        <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
          <code>{highlight(code, format)}</code>
        </pre>
      </div>
    </div>
  );
}

// Lightweight tokenizer — no external highlighting library. Splits the output on
// a single alternation regex and wraps each match in a themed token span.
function highlight(code: string, format: PreviewFormat): ReactNode {
  const regex =
    format === "sql"
      ? /('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|BETWEEN|LIKE|IS|NULL|TRUE|FALSE)\b/g
      : /("(?:\\.|[^"\\])*")(?=\s*:)|("(?:\\.|[^"\\])*")|(-?\b\d+(?:\.\d+)?\b)|\b(true|false|null)\b/g;

  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const match of code.matchAll(regex)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(code.slice(last, start));

    const cls =
      format === "sql"
        ? match[1]
          ? "tok-string"
          : match[2]
            ? "tok-number"
            : "tok-keyword"
        : match[1]
          ? "tok-key"
          : match[2]
            ? "tok-string"
            : match[3]
              ? "tok-number"
              : "tok-bool";

    nodes.push(
      <span key={key++} className={cls}>
        {match[0]}
      </span>
    );
    last = start + match[0].length;
  }

  if (last < code.length) nodes.push(code.slice(last));
  return nodes;
}
