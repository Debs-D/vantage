import { describe, expect, it } from "vitest";
import { isTreeValid, validateTree } from "@/lib/query/validator";
import { createCondition, createGroup } from "@/lib/query/tree";
import { Group } from "@/lib/query/types";

const fields = {
  name: "string",
  age: "number",
  active: "boolean",
  status: "enum",
  createdAt: "date",
} as const;

function tree(...children: Group["children"]): Group {
  return { ...createGroup(), children };
}

describe("structural validation", () => {
  it("flags an empty group", () => {
    const errors = validateTree(createGroup());
    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe("empty-group");
  });

  it("flags a condition with no field selected", () => {
    const errors = validateTree(tree(createCondition("")));
    expect(errors.map((e) => e.type)).toContain("empty-field");
  });

  it("passes a complete, simple query", () => {
    const cond = { ...createCondition("name"), operator: "equals" as const, value: "Ada" };
    expect(isTreeValid(tree(cond), fields)).toBe(true);
  });
});

describe("missing values", () => {
  it("flags a value-bearing operator with no value", () => {
    const cond = { ...createCondition("name"), operator: "contains" as const, value: null };
    expect(validateTree(tree(cond), fields).map((e) => e.type)).toContain("missing-value");
  });

  it("does not require a value for isNull / isNotNull", () => {
    const cond = { ...createCondition("name"), operator: "isNull" as const, value: null };
    expect(isTreeValid(tree(cond), fields)).toBe(true);
  });

  it("requires both bounds for between", () => {
    const incomplete = { ...createCondition("age"), operator: "between" as const, value: [5] };
    expect(validateTree(tree(incomplete), fields).map((e) => e.type)).toContain("missing-value");

    const complete = { ...createCondition("age"), operator: "between" as const, value: [5, 10] };
    expect(isTreeValid(tree(complete), fields)).toBe(true);
  });

  it("requires at least one member for in", () => {
    const empty = { ...createCondition("status"), operator: "in" as const, value: [] };
    expect(validateTree(tree(empty), fields).map((e) => e.type)).toContain("missing-value");
  });
});

describe("schema-aware validation", () => {
  it("flags an operator that is incompatible with the field type", () => {
    const cond = { ...createCondition("age"), operator: "contains" as const, value: "x" };
    expect(validateTree(tree(cond), fields).map((e) => e.type)).toContain(
      "incompatible-operator"
    );
  });

  it("flags a field that is not in the schema", () => {
    const cond = { ...createCondition("nope"), operator: "equals" as const, value: "x" };
    expect(validateTree(tree(cond), fields).map((e) => e.type)).toContain("unknown-field");
  });

  it("skips operator checks when no field types are supplied", () => {
    const cond = { ...createCondition("age"), operator: "contains" as const, value: "x" };
    expect(isTreeValid(tree(cond))).toBe(true);
  });
});

describe("nested validation", () => {
  it("collects errors from conditions buried in nested groups", () => {
    const bad = createCondition(""); // empty field
    const inner: Group = { ...createGroup(), children: [bad] };
    const root: Group = { ...createGroup(), children: [inner] };

    const errors = validateTree(root, fields);
    expect(errors.some((e) => e.nodeId === bad.id && e.type === "empty-field")).toBe(true);
  });
});
