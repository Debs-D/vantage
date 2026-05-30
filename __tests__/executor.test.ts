import { describe, expect, it } from "vitest";
import { executeQuery } from "@/lib/data/executor";
import { users } from "@/lib/data/datasets";
import { createCondition, createGroup } from "@/lib/query/tree";
import { Condition, Group, OperatorKey } from "@/lib/query/types";
import { SchemaDefinition } from "@/lib/schema/types";
import { usersSchema } from "@/lib/schema/schemas";

// A tiny schema + dataset so expected results can be reasoned about by hand.
const schema: SchemaDefinition = {
  key: "people",
  label: "People",
  fields: [
    { key: "name", label: "Name", type: "string" },
    { key: "age", label: "Age", type: "number" },
    { key: "role", label: "Role", type: "enum", options: ["admin", "user", "guest"] },
    { key: "active", label: "Active", type: "boolean" },
    { key: "joined", label: "Joined", type: "date" },
    { key: "nickname", label: "Nickname", type: "string" },
  ],
};

const people = [
  { name: "Ada", age: 30, role: "admin", active: true, joined: "2023-01-10", nickname: "countess" },
  { name: "Grace", age: 45, role: "user", active: true, joined: "2023-06-01", nickname: null },
  { name: "Alan", age: 25, role: "user", active: false, joined: "2024-02-15", nickname: "prof" },
  { name: "Linus", age: 50, role: "guest", active: true, joined: "2024-09-20", nickname: null },
];

function cond(field: string, operator: OperatorKey, value: Condition["value"]): Condition {
  return { ...createCondition(field), operator, value };
}

function group(logic: "AND" | "OR", children: Group["children"]): Group {
  return { ...createGroup(logic), children };
}

const run = (tree: Group) => executeQuery(tree, people, schema).map((p) => p.name);

describe("scalar operators", () => {
  it("equals matches one row", () => {
    expect(run(group("AND", [cond("name", "equals", "Ada")]))).toEqual(["Ada"]);
  });

  it("notEquals excludes the match", () => {
    expect(run(group("AND", [cond("role", "notEquals", "user")]))).toEqual(["Ada", "Linus"]);
  });

  it("numeric comparisons", () => {
    expect(run(group("AND", [cond("age", "gte", 45)]))).toEqual(["Grace", "Linus"]);
    expect(run(group("AND", [cond("age", "lt", 30)]))).toEqual(["Alan"]);
  });

  it("boolean equals", () => {
    expect(run(group("AND", [cond("active", "equals", true)]))).toEqual(["Ada", "Grace", "Linus"]);
  });
});

describe("string operators", () => {
  it("contains is case-insensitive", () => {
    expect(run(group("AND", [cond("name", "contains", "a")]))).toEqual(["Ada", "Grace", "Alan"]);
  });

  it("startsWith / endsWith", () => {
    expect(run(group("AND", [cond("name", "startsWith", "Al")]))).toEqual(["Alan"]);
    expect(run(group("AND", [cond("name", "endsWith", "us")]))).toEqual(["Linus"]);
  });
});

describe("null operators", () => {
  it("isNull / isNotNull", () => {
    expect(run(group("AND", [cond("nickname", "isNull", null)]))).toEqual(["Grace", "Linus"]);
    expect(run(group("AND", [cond("nickname", "isNotNull", null)]))).toEqual(["Ada", "Alan"]);
  });
});

describe("set and range operators", () => {
  it("in matches any listed member", () => {
    expect(run(group("AND", [cond("role", "in", ["admin", "guest"])]))).toEqual(["Ada", "Linus"]);
  });

  it("between is inclusive on numbers", () => {
    expect(run(group("AND", [cond("age", "between", [25, 45])]))).toEqual(["Ada", "Grace", "Alan"]);
  });

  it("date before / after / between", () => {
    expect(run(group("AND", [cond("joined", "before", "2024-01-01")]))).toEqual(["Ada", "Grace"]);
    expect(run(group("AND", [cond("joined", "after", "2024-01-01")]))).toEqual(["Alan", "Linus"]);
    expect(run(group("AND", [cond("joined", "between", ["2023-05-01", "2024-03-01"])]))).toEqual([
      "Grace",
      "Alan",
    ]);
  });
});

describe("logic composition", () => {
  it("AND requires every child to match", () => {
    const tree = group("AND", [cond("active", "equals", true), cond("age", "gt", 40)]);
    expect(run(tree)).toEqual(["Grace", "Linus"]);
  });

  it("OR requires any child to match", () => {
    const tree = group("OR", [cond("role", "equals", "admin"), cond("age", "lt", 26)]);
    expect(run(tree)).toEqual(["Ada", "Alan"]);
  });

  it("evaluates nested groups correctly", () => {
    // active = true AND (role = guest OR age < 26)  →  Linus (guest), Alan is inactive
    const tree = group("AND", [
      cond("active", "equals", true),
      group("OR", [cond("role", "equals", "guest"), cond("age", "lt", 26)]),
    ]);
    expect(run(tree)).toEqual(["Linus"]);
  });

  it("an empty group matches everything", () => {
    expect(run(createGroup())).toEqual(["Ada", "Grace", "Alan", "Linus"]);
  });
});

describe("against the real mock dataset", () => {
  it("ships 150 users and filters a known slice", () => {
    expect(users).toHaveLength(150);
    const active = executeQuery(
      group("AND", [cond("status", "equals", "active")]),
      users,
      usersSchema
    );
    expect(active.length).toBeGreaterThan(0);
    expect(active.every((u) => u.status === "active")).toBe(true);
  });
});
