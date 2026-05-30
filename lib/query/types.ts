// The recursive query model. Everything in the app — rendering, serialization,
// validation, drag-and-drop — operates on this tree.

export type LogicOperator = "AND" | "OR";

export type FieldType = "string" | "number" | "boolean" | "enum" | "date";

export type OperatorKey =
  | "equals"
  | "notEquals"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "isNull"
  | "isNotNull"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "in"
  | "before"
  | "after";

// A single value, a two-ended range (between), or a set (in).
export type ConditionValue =
  | string
  | number
  | boolean
  | null
  | Array<string | number>;

export interface Condition {
  id: string;
  type: "condition";
  field: string;
  operator: OperatorKey;
  value: ConditionValue;
}

export interface Group {
  id: string;
  type: "group";
  logic: LogicOperator;
  children: QueryNode[]; // recursive: a child is either a Condition or a Group
  collapsed?: boolean;
}

export type QueryNode = Condition | Group;

// The root of a query is always a Group.
export type QueryTree = Group;

// Canonical mapping of field type to the operators it allows. This is the single
// source of truth the validator checks against; the schema layer builds its
// display metadata on top of it.
export const OPERATORS_BY_TYPE: Record<FieldType, OperatorKey[]> = {
  string: ["equals", "notEquals", "contains", "startsWith", "endsWith", "isNull", "isNotNull"],
  number: ["equals", "notEquals", "gt", "gte", "lt", "lte", "between"],
  boolean: ["equals"],
  enum: ["equals", "notEquals", "in"],
  date: ["equals", "before", "after", "between"],
};

// Operators that stand alone and take no value.
export const NO_VALUE_OPERATORS: OperatorKey[] = ["isNull", "isNotNull"];

// Operators whose value is a collection rather than a scalar.
export const MULTI_VALUE_OPERATORS: OperatorKey[] = ["between", "in"];

export function valueRequired(operator: OperatorKey): boolean {
  return !NO_VALUE_OPERATORS.includes(operator);
}

export function isMultiValueOperator(operator: OperatorKey): boolean {
  return MULTI_VALUE_OPERATORS.includes(operator);
}
