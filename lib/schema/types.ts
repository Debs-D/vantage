import { FieldType, OperatorKey } from "@/lib/query/types";

// How many operands an operator needs. The widget that collects them (text vs.
// number vs. date picker) is decided by the field type; arity decides how many.
export type OperatorArity = "none" | "one" | "two" | "many";

export interface OperatorDef {
  key: OperatorKey;
  label: string;
  arity: OperatorArity;
}

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[]; // enum members, when type is "enum"
}

export interface SchemaDefinition {
  key: string;
  label: string;
  fields: FieldDef[];
}
