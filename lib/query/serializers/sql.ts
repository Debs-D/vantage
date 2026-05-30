import { Condition, FieldType, Group, QueryNode } from "@/lib/query/types";
import { SchemaDefinition } from "@/lib/schema/types";
import { fieldTypesOf } from "@/lib/schema/schemas";

// Serializes the query tree to a SQL statement. The WHERE clause is built by the
// same recursive descent the executor uses — nested groups are parenthesized so
// AND/OR precedence is always explicit and correct.

export function toSQL(tree: Group, schema: SchemaDefinition): string {
  const types = fieldTypesOf(schema);
  const where = clause(tree, types);
  const base = `SELECT *\nFROM ${schema.key}`;
  return where ? `${base}\nWHERE ${where};` : `${base};`;
}

function clause(group: Group, types: Record<string, FieldType>): string {
  const parts = group.children
    .map((child) => node(child, types))
    .filter((part): part is string => part.length > 0);
  return parts.join(` ${group.logic} `);
}

function node(n: QueryNode, types: Record<string, FieldType>): string {
  if (n.type === "group") {
    const inner = clause(n, types);
    return inner ? `(${inner})` : "";
  }
  return condition(n, types);
}

function condition(c: Condition, types: Record<string, FieldType>): string {
  if (!c.field) return "";
  const type = types[c.field];
  const f = c.field;

  switch (c.operator) {
    case "isNull":
      return `${f} IS NULL`;
    case "isNotNull":
      return `${f} IS NOT NULL`;
    case "equals":
      return `${f} = ${literal(c.value, type)}`;
    case "notEquals":
      return `${f} != ${literal(c.value, type)}`;
    case "gt":
      return `${f} > ${literal(c.value, type)}`;
    case "gte":
      return `${f} >= ${literal(c.value, type)}`;
    case "lt":
      return `${f} < ${literal(c.value, type)}`;
    case "lte":
      return `${f} <= ${literal(c.value, type)}`;
    case "before":
      return `${f} < ${literal(c.value, type)}`;
    case "after":
      return `${f} > ${literal(c.value, type)}`;
    case "contains":
      return `${f} LIKE ${like(c.value, "%", "%")}`;
    case "startsWith":
      return `${f} LIKE ${like(c.value, "", "%")}`;
    case "endsWith":
      return `${f} LIKE ${like(c.value, "%", "")}`;
    case "between": {
      const [lo, hi] = Array.isArray(c.value) ? c.value : [];
      return `${f} BETWEEN ${literal(lo, type)} AND ${literal(hi, type)}`;
    }
    case "in": {
      const list = (Array.isArray(c.value) ? c.value : [])
        .map((v) => literal(v, type))
        .join(", ");
      return `${f} IN (${list})`;
    }
    default:
      return "";
  }
}

function literal(value: unknown, type: FieldType | undefined): string {
  if (value === null || value === undefined || value === "") return "NULL";
  if (type === "number") return String(value);
  if (type === "boolean") return value === true || value === "true" ? "TRUE" : "FALSE";
  return quote(value);
}

function like(value: unknown, prefix: string, suffix: string): string {
  if (value === null || value === undefined) return "NULL";
  return quote(`${prefix}${value}${suffix}`);
}

// Wrap in single quotes, doubling any embedded quotes (standard SQL escaping).
function quote(value: unknown): string {
  return `'${String(value).replace(/'/g, "''")}'`;
}
