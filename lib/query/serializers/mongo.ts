import { Condition, FieldType, Group, QueryNode } from "@/lib/query/types";
import { SchemaDefinition } from "@/lib/schema/types";
import { fieldTypesOf } from "@/lib/schema/schemas";

export type MongoFilter = Record<string, unknown>;

// Serializes the query tree to a MongoDB filter object. Groups become $and/$or
// arrays; a group with a single child collapses to that child so the output
// stays as clean as a hand-written filter.

export function toMongo(tree: Group, schema: SchemaDefinition): MongoFilter {
  return group(tree, fieldTypesOf(schema));
}

function group(g: Group, types: Record<string, FieldType>): MongoFilter {
  const parts = g.children
    .map((child) => node(child, types))
    .filter((part): part is MongoFilter => part !== null);

  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { [g.logic === "AND" ? "$and" : "$or"]: parts };
}

function node(n: QueryNode, types: Record<string, FieldType>): MongoFilter | null {
  if (n.type === "group") {
    const result = group(n, types);
    return Object.keys(result).length === 0 ? null : result;
  }
  return condition(n, types);
}

function condition(c: Condition, types: Record<string, FieldType>): MongoFilter | null {
  if (!c.field) return null;
  const type = types[c.field];
  const f = c.field;
  const v = coerce(c.value, type);

  switch (c.operator) {
    case "equals":
      return { [f]: v };
    case "notEquals":
      return { [f]: { $ne: v } };
    case "gt":
      return { [f]: { $gt: v } };
    case "gte":
      return { [f]: { $gte: v } };
    case "lt":
      return { [f]: { $lt: v } };
    case "lte":
      return { [f]: { $lte: v } };
    case "before":
      return { [f]: { $lt: v } };
    case "after":
      return { [f]: { $gt: v } };
    case "contains":
      return { [f]: { $regex: String(c.value ?? ""), $options: "i" } };
    case "startsWith":
      return { [f]: { $regex: `^${String(c.value ?? "")}`, $options: "i" } };
    case "endsWith":
      return { [f]: { $regex: `${String(c.value ?? "")}$`, $options: "i" } };
    case "isNull":
      return { [f]: null };
    case "isNotNull":
      return { [f]: { $ne: null } };
    case "between": {
      const [lo, hi] = Array.isArray(c.value) ? c.value : [];
      return { [f]: { $gte: coerce(lo, type), $lte: coerce(hi, type) } };
    }
    case "in": {
      const list = (Array.isArray(c.value) ? c.value : []).map((x) => coerce(x, type));
      return { [f]: { $in: list } };
    }
    default:
      return null;
  }
}

// Keep native JS types so JSON.stringify renders numbers and booleans unquoted.
function coerce(value: unknown, type: FieldType | undefined): unknown {
  if (value === null || value === undefined || value === "") return null;
  if (type === "number") return Number(value);
  if (type === "boolean") return value === true || value === "true";
  return String(value);
}
