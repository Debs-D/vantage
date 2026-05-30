import { FieldType, OPERATORS_BY_TYPE, OperatorKey } from "@/lib/query/types";
import { OperatorDef } from "./types";

// Display metadata for every operator. The set of operators allowed per field
// type still comes from OPERATORS_BY_TYPE (the single source of truth in the
// query layer) — this only adds human labels and operand counts on top.
export const OPERATOR_DEFS: Record<OperatorKey, OperatorDef> = {
  equals: { key: "equals", label: "equals", arity: "one" },
  notEquals: { key: "notEquals", label: "not equals", arity: "one" },
  contains: { key: "contains", label: "contains", arity: "one" },
  startsWith: { key: "startsWith", label: "starts with", arity: "one" },
  endsWith: { key: "endsWith", label: "ends with", arity: "one" },
  isNull: { key: "isNull", label: "is empty", arity: "none" },
  isNotNull: { key: "isNotNull", label: "is not empty", arity: "none" },
  gt: { key: "gt", label: "greater than", arity: "one" },
  gte: { key: "gte", label: "at least", arity: "one" },
  lt: { key: "lt", label: "less than", arity: "one" },
  lte: { key: "lte", label: "at most", arity: "one" },
  between: { key: "between", label: "between", arity: "two" },
  in: { key: "in", label: "is any of", arity: "many" },
  before: { key: "before", label: "before", arity: "one" },
  after: { key: "after", label: "after", arity: "one" },
};

export function operatorsForType(type: FieldType): OperatorDef[] {
  return OPERATORS_BY_TYPE[type].map((key) => OPERATOR_DEFS[key]);
}
