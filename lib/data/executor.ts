import { Condition, FieldType, Group, OperatorKey, QueryNode } from "@/lib/query/types";
import { SchemaDefinition } from "@/lib/schema/types";
import { fieldTypesOf } from "@/lib/schema/schemas";

// Runs a query tree against a dataset and returns the matching rows. The tree is
// walked recursively — exactly the same traversal as the serializers — combining
// child results with the group's AND/OR logic.

export function executeQuery<T extends Record<string, unknown>>(
  tree: Group,
  dataset: T[],
  schema: SchemaDefinition
): T[] {
  const types = fieldTypesOf(schema);
  return dataset.filter((row) => matchNode(tree, row, types));
}

function matchNode(
  node: QueryNode,
  row: Record<string, unknown>,
  types: Record<string, FieldType>
): boolean {
  if (node.type === "group") return matchGroup(node, row, types);
  return matchCondition(node, row, types);
}

function matchGroup(
  group: Group,
  row: Record<string, unknown>,
  types: Record<string, FieldType>
): boolean {
  // An empty group constrains nothing, so it matches every row.
  if (group.children.length === 0) return true;
  const results = group.children.map((child) => matchNode(child, row, types));
  return group.logic === "AND" ? results.every(Boolean) : results.some(Boolean);
}

function matchCondition(
  condition: Condition,
  row: Record<string, unknown>,
  types: Record<string, FieldType>
): boolean {
  return compare(
    row[condition.field],
    condition.operator,
    condition.value,
    types[condition.field]
  );
}

function compare(
  fieldValue: unknown,
  operator: OperatorKey,
  value: unknown,
  type: FieldType | undefined
): boolean {
  // Null checks are meaningful even when the field itself is absent.
  if (operator === "isNull") return fieldValue === null || fieldValue === undefined;
  if (operator === "isNotNull") return fieldValue !== null && fieldValue !== undefined;

  if (fieldValue === null || fieldValue === undefined) return false;

  switch (operator) {
    case "equals":
      return equals(fieldValue, value, type);
    case "notEquals":
      return !equals(fieldValue, value, type);
    case "contains":
      return text(fieldValue).includes(text(value));
    case "startsWith":
      return text(fieldValue).startsWith(text(value));
    case "endsWith":
      return text(fieldValue).endsWith(text(value));
    case "gt":
      return num(fieldValue) > num(value);
    case "gte":
      return num(fieldValue) >= num(value);
    case "lt":
      return num(fieldValue) < num(value);
    case "lte":
      return num(fieldValue) <= num(value);
    case "between": {
      if (!Array.isArray(value) || value.length !== 2) return false;
      const [lo, hi] = value;
      if (type === "date") {
        return time(fieldValue) >= time(lo) && time(fieldValue) <= time(hi);
      }
      return num(fieldValue) >= num(lo) && num(fieldValue) <= num(hi);
    }
    case "in":
      return Array.isArray(value) && value.some((v) => equals(fieldValue, v, type));
    case "before":
      return time(fieldValue) < time(value);
    case "after":
      return time(fieldValue) > time(value);
    default:
      return false;
  }
}

function equals(a: unknown, b: unknown, type: FieldType | undefined): boolean {
  if (type === "number") return num(a) === num(b);
  if (type === "boolean") return Boolean(a) === Boolean(b);
  return a === b;
}

function text(value: unknown): string {
  return String(value).toLowerCase();
}

function num(value: unknown): number {
  return Number(value);
}

function time(value: unknown): number {
  return new Date(value as string | number).getTime();
}
