import { describe, expect, it } from "vitest";
import { parseQuery, serializeQuery } from "@/lib/query/io";
import { createCondition, createGroup } from "@/lib/query/tree";
import { Group } from "@/lib/query/types";

function sampleTree(): Group {
  const condition = { ...createCondition("name"), operator: "equals" as const, value: "Ada" };
  const nested: Group = { ...createGroup("OR"), children: [createCondition("age")] };
  return { ...createGroup("AND"), children: [condition, nested] };
}

describe("round-trip", () => {
  it("serializes and parses back to an equivalent query", () => {
    const tree = sampleTree();
    const restored = parseQuery(serializeQuery(tree, "users"));

    expect(restored.schemaKey).toBe("users");
    expect(restored.tree).toEqual(tree);
  });
});

describe("validation", () => {
  it("rejects non-JSON", () => {
    expect(() => parseQuery("not json")).toThrow(/valid JSON/);
  });

  it("rejects an unknown dataset", () => {
    const text = serializeQuery(sampleTree(), "users").replace("users", "ghosts");
    expect(() => parseQuery(text)).toThrow(/unknown dataset/);
  });

  it("rejects a tree whose root is not a group", () => {
    const bad = JSON.stringify({
      version: 1,
      schemaKey: "users",
      tree: { id: "x", type: "condition", field: "name", operator: "equals", value: null },
    });
    expect(() => parseQuery(bad)).toThrow(/valid query tree/);
  });

  it("rejects a group with an invalid child", () => {
    const bad = JSON.stringify({
      version: 1,
      schemaKey: "users",
      tree: { id: "r", type: "group", logic: "AND", children: [{ id: "c", type: "mystery" }] },
    });
    expect(() => parseQuery(bad)).toThrow(/valid query tree/);
  });

  it("rejects a group with a bad logic operator", () => {
    const bad = JSON.stringify({
      version: 1,
      schemaKey: "users",
      tree: { id: "r", type: "group", logic: "XOR", children: [] },
    });
    expect(() => parseQuery(bad)).toThrow(/valid query tree/);
  });
});
