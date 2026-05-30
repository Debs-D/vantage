import {
  ConditionValue,
  FieldType,
  Group,
  isMultiValueOperator,
  OPERATORS_BY_TYPE,
  OperatorKey,
  valueRequired,
} from "./types";
import { traverseTree } from "./tree";

export type ValidationErrorType =
  | "empty-group"
  | "empty-field"
  | "unknown-field"
  | "incompatible-operator"
  | "missing-value";

export interface ValidationError {
  nodeId: string;
  type: ValidationErrorType;
  message: string;
}

// A field-name → type lookup is all the validator needs from the schema layer.
// Keeping the dependency this thin means the engine can be tested without any
// schema definitions, and any schema can satisfy it.
export type FieldTypes = Record<string, FieldType>;

export function validateTree(tree: Group, fieldTypes?: FieldTypes): ValidationError[] {
  const errors: ValidationError[] = [];

  traverseTree(tree, (node) => {
    if (node.type === "group") {
      if (node.children.length === 0) {
        errors.push({
          nodeId: node.id,
          type: "empty-group",
          message: "Group has no conditions.",
        });
      }
      return;
    }

    if (node.field === "") {
      errors.push({
        nodeId: node.id,
        type: "empty-field",
        message: "Select a field.",
      });
      return;
    }

    if (fieldTypes) {
      const fieldType = fieldTypes[node.field];
      if (!fieldType) {
        errors.push({
          nodeId: node.id,
          type: "unknown-field",
          message: `Unknown field "${node.field}".`,
        });
        return;
      }
      if (!OPERATORS_BY_TYPE[fieldType].includes(node.operator)) {
        errors.push({
          nodeId: node.id,
          type: "incompatible-operator",
          message: `Operator "${node.operator}" is not valid for a ${fieldType} field.`,
        });
      }
    }

    if (valueRequired(node.operator) && !hasValue(node.value, node.operator)) {
      errors.push({
        nodeId: node.id,
        type: "missing-value",
        message: "Enter a value.",
      });
    }
  });

  return errors;
}

export function isTreeValid(tree: Group, fieldTypes?: FieldTypes): boolean {
  return validateTree(tree, fieldTypes).length === 0;
}

function hasValue(value: ConditionValue, operator: OperatorKey): boolean {
  if (isMultiValueOperator(operator)) {
    if (!Array.isArray(value)) return false;
    // `between` needs exactly two bounds; `in` needs at least one member.
    if (operator === "between" && value.length !== 2) return false;
    return value.length > 0 && value.every(isPresent);
  }
  return isPresent(value);
}

function isPresent(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}
