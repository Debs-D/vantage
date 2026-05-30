import { beforeEach, describe, expect, it } from "vitest";
import { useQueryStore } from "@/lib/store/query-store";
import { createGroup } from "@/lib/query/tree";

const store = useQueryStore.getState;

beforeEach(() => {
  // Reset the singleton store between tests.
  useQueryStore.setState({
    activeSchemaKey: "users",
    tree: createGroup("AND"),
    history: [],
    presets: [],
  });
});

describe("addCondition", () => {
  it("adds a condition to the root with a type-appropriate default operator", () => {
    const rootId = store().tree.id;
    store().addCondition(rootId, "age"); // age is a number field

    const child = store().tree.children[0];
    expect(child.type).toBe("condition");
    expect(child).toMatchObject({ field: "age", operator: "equals" });
  });

  it("records history so the change can be undone", () => {
    store().addCondition(store().tree.id, "name");
    expect(store().tree.children).toHaveLength(1);
    expect(store().history).toHaveLength(1);

    store().undo();
    expect(store().tree.children).toHaveLength(0);
    expect(store().history).toHaveLength(0);
  });
});

describe("setSchema", () => {
  it("switches schema and resets the query", () => {
    store().addCondition(store().tree.id, "name");
    store().setSchema("orders");

    expect(store().activeSchemaKey).toBe("orders");
    expect(store().tree.children).toHaveLength(0);
    expect(store().history).toHaveLength(0);
  });
});

describe("undo", () => {
  it("is a no-op when there is no history", () => {
    const before = store().tree;
    store().undo();
    expect(store().tree).toBe(before);
  });

  it("steps back one mutation at a time", () => {
    const rootId = store().tree.id;
    store().addCondition(rootId, "name");
    store().addCondition(rootId, "age");
    expect(store().tree.children).toHaveLength(2);

    store().undo();
    expect(store().tree.children).toHaveLength(1);
  });
});

describe("presets", () => {
  it("saves, loads, and deletes a named query", () => {
    store().addCondition(store().tree.id, "name");
    store().savePreset("My query");

    const preset = store().presets[0];
    expect(preset).toMatchObject({ name: "My query", schemaKey: "users" });

    // Mutate away from the saved state, then restore it.
    store().clear();
    expect(store().tree.children).toHaveLength(0);

    store().loadPreset(preset.id);
    expect(store().tree.children).toHaveLength(1);

    store().deletePreset(preset.id);
    expect(store().presets).toHaveLength(0);
  });
});
