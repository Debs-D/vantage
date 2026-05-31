import { Group, LogicOperator, QueryNode } from "@/lib/query/types";
import { SCHEMAS } from "@/lib/schema/schemas";

// Export/import for queries. The file is an envelope of { schemaKey, tree } so a
// reopened query lands back on the dataset it was built against. Parsing is
// strict — a malformed file is rejected with a readable message rather than
// loading a half-valid tree.

const FILE_VERSION = 1;
export const EXPORT_FILENAME = "vantage-query.json";

interface QueryFile {
  version: number;
  schemaKey: string;
  tree: Group;
}

export function serializeQuery(tree: Group, schemaKey: string): string {
  const file: QueryFile = { version: FILE_VERSION, schemaKey, tree };
  return JSON.stringify(file, null, 2);
}

export function parseQuery(text: string): { schemaKey: string; tree: Group } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("File is not valid JSON.");
  }

  if (!isRecord(data)) throw new Error("File is not a query object.");
  if (typeof data.schemaKey !== "string" || !SCHEMAS[data.schemaKey]) {
    throw new Error("File references an unknown dataset.");
  }
  if (!isValidNode(data.tree) || (data.tree as QueryNode).type !== "group") {
    throw new Error("File does not contain a valid query tree.");
  }

  return { schemaKey: data.schemaKey, tree: data.tree as Group };
}

// Recursively checks that a value has the shape of a QueryNode.
function isValidNode(value: unknown): boolean {
  if (!isRecord(value) || typeof value.id !== "string") return false;

  if (value.type === "condition") {
    return typeof value.field === "string" && typeof value.operator === "string";
  }
  if (value.type === "group") {
    const logic = value.logic as LogicOperator;
    return (
      (logic === "AND" || logic === "OR") &&
      Array.isArray(value.children) &&
      value.children.every(isValidNode)
    );
  }
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// ── Browser-only helpers ──────────────────────────────

export function downloadQuery(tree: Group, schemaKey: string): void {
  const blob = new Blob([serializeQuery(tree, schemaKey)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = EXPORT_FILENAME;
  link.click();
  URL.revokeObjectURL(url);
}

export async function readQueryFile(
  file: File
): Promise<{ schemaKey: string; tree: Group }> {
  return parseQuery(await file.text());
}
