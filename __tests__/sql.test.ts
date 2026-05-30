import { describe, expect, it } from "vitest";
import { toSQL } from "@/lib/query/serializers/sql";
import { createCondition, createGroup } from "@/lib/query/tree";
import { Condition, Group, OperatorKey } from "@/lib/query/types";
import { SchemaDefinition } from "@/lib/schema/types";

const schema: SchemaDefinition = {
  key: "users",
  label: "Users",
  fields: [
    { key: "name", label: "Name", type: "string" },
    { key: "age", label: "Age", type: "number" },
    { key: "status", label: "Status", type: "enum", options: ["active", "inactive"] },
    { key: "active", label: "Active", type: "boolean" },
    { key: "joined", label: "Joined", type: "date" },
  ],
};

function cond(field: string, operator: OperatorKey, value: Condition["value"]): Condition {
  return { ...createCondition(field), operator, value };
}

function group(logic: "AND" | "OR", children: Group["children"]): Group {
  return { ...createGroup(logic), children };
}

// Pull out just the WHERE clause for focused assertions.
function where(tree: Group): string {
  const match = toSQL(tree, schema).match(/WHERE (.+);/);
  return match ? match[1] : "";
}

describe("scalar conditions", () => {
  it("quotes strings and leaves numbers bare", () => {
    expect(where(group("AND", [cond("name", "equals", "Ada")]))).toBe("name = 'Ada'");
    expect(where(group("AND", [cond("age", "gt", 18)]))).toBe("age > 18");
  });

  it("escapes embedded single quotes", () => {
    expect(where(group("AND", [cond("name", "equals", "O'Brien")]))).toBe(
      "name = 'O''Brien'"
    );
  });

  it("renders booleans as TRUE / FALSE", () => {
    expect(where(group("AND", [cond("active", "equals", true)]))).toBe("active = TRUE");
  });

  it("renders null checks without a value", () => {
    expect(where(group("AND", [cond("name", "isNull", null)]))).toBe("name IS NULL");
    expect(where(group("AND", [cond("name", "isNotNull", null)]))).toBe(
      "name IS NOT NULL"
    );
  });
});

describe("pattern, range, and set operators", () => {
  it("builds LIKE patterns", () => {
    expect(where(group("AND", [cond("name", "contains", "ad")]))).toBe(
      "name LIKE '%ad%'"
    );
    expect(where(group("AND", [cond("name", "startsWith", "Ad")]))).toBe(
      "name LIKE 'Ad%'"
    );
    expect(where(group("AND", [cond("name", "endsWith", "da")]))).toBe(
      "name LIKE '%da'"
    );
  });

  it("builds BETWEEN and IN", () => {
    expect(where(group("AND", [cond("age", "between", [18, 30])]))).toBe(
      "age BETWEEN 18 AND 30"
    );
    expect(
      where(group("AND", [cond("status", "in", ["active", "inactive"])]))
    ).toBe("status IN ('active', 'inactive')");
  });
});

describe("logic and nesting", () => {
  it("joins siblings with the group's operator", () => {
    const tree = group("AND", [cond("name", "equals", "Ada"), cond("age", "gt", 18)]);
    expect(where(tree)).toBe("name = 'Ada' AND age > 18");
  });

  it("parenthesizes nested groups", () => {
    const tree = group("AND", [
      cond("name", "equals", "Ada"),
      group("OR", [cond("age", "gt", 18), cond("status", "equals", "active")]),
    ]);
    expect(where(tree)).toBe("name = 'Ada' AND (age > 18 OR status = 'active')");
  });

  it("omits WHERE entirely for an empty query", () => {
    expect(toSQL(createGroup("AND"), schema)).toBe("SELECT *\nFROM users;");
  });
});
