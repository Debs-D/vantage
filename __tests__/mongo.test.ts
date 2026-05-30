import { describe, expect, it } from "vitest";
import { toMongo } from "@/lib/query/serializers/mongo";
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
  ],
};

function cond(field: string, operator: OperatorKey, value: Condition["value"]): Condition {
  return { ...createCondition(field), operator, value };
}

function group(logic: "AND" | "OR", children: Group["children"]): Group {
  return { ...createGroup(logic), children };
}

describe("condition mapping", () => {
  it("uses shorthand equality and coerces value types", () => {
    expect(toMongo(group("AND", [cond("name", "equals", "Ada")]), schema)).toEqual({
      name: "Ada",
    });
    // age is numeric, so the value is a real number, not a string
    expect(toMongo(group("AND", [cond("age", "equals", "30")]), schema)).toEqual({
      age: 30,
    });
  });

  it("maps comparison operators", () => {
    expect(toMongo(group("AND", [cond("age", "gt", 18)]), schema)).toEqual({
      age: { $gt: 18 },
    });
    expect(toMongo(group("AND", [cond("name", "notEquals", "Ada")]), schema)).toEqual({
      name: { $ne: "Ada" },
    });
  });

  it("maps contains to a case-insensitive regex", () => {
    expect(toMongo(group("AND", [cond("name", "contains", "ad")]), schema)).toEqual({
      name: { $regex: "ad", $options: "i" },
    });
  });

  it("maps between to a $gte/$lte range and in to $in", () => {
    expect(toMongo(group("AND", [cond("age", "between", [18, 30])]), schema)).toEqual({
      age: { $gte: 18, $lte: 30 },
    });
    expect(
      toMongo(group("AND", [cond("status", "in", ["active", "inactive"])]), schema)
    ).toEqual({ status: { $in: ["active", "inactive"] } });
  });

  it("maps null checks", () => {
    expect(toMongo(group("AND", [cond("name", "isNull", null)]), schema)).toEqual({
      name: null,
    });
    expect(toMongo(group("AND", [cond("name", "isNotNull", null)]), schema)).toEqual({
      name: { $ne: null },
    });
  });
});

describe("logic and nesting", () => {
  it("collapses a single-child group to the child", () => {
    expect(toMongo(group("AND", [cond("age", "gt", 18)]), schema)).toEqual({
      age: { $gt: 18 },
    });
  });

  it("wraps multiple children in $and / $or", () => {
    const tree = group("OR", [cond("name", "equals", "Ada"), cond("age", "lt", 40)]);
    expect(toMongo(tree, schema)).toEqual({
      $or: [{ name: "Ada" }, { age: { $lt: 40 } }],
    });
  });

  it("nests groups", () => {
    const tree = group("AND", [
      cond("name", "equals", "Ada"),
      group("OR", [cond("age", "gt", 18), cond("status", "equals", "active")]),
    ]);
    expect(toMongo(tree, schema)).toEqual({
      $and: [
        { name: "Ada" },
        { $or: [{ age: { $gt: 18 } }, { status: "active" }] },
      ],
    });
  });

  it("returns an empty filter for an empty query", () => {
    expect(toMongo(createGroup("AND"), schema)).toEqual({});
  });
});
