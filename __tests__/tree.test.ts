import { describe, expect, it } from "vitest";
import {
  addNode,
  createCondition,
  createGroup,
  findNode,
  moveNode,
  removeNode,
  toggleCollapse,
  traverseTree,
  updateCondition,
  updateGroupLogic,
} from "@/lib/query/tree";
import { Group } from "@/lib/query/types";

describe("createGroup / createCondition", () => {
  it("creates a group with a default AND logic and no children", () => {
    const group = createGroup();
    expect(group.type).toBe("group");
    expect(group.logic).toBe("AND");
    expect(group.children).toEqual([]);
    expect(group.id).toBeTruthy();
  });

  it("creates a condition with sensible defaults", () => {
    const condition = createCondition("age");
    expect(condition.type).toBe("condition");
    expect(condition.field).toBe("age");
    expect(condition.operator).toBe("equals");
    expect(condition.value).toBeNull();
  });

  it("gives every node a unique id", () => {
    const ids = new Set([createGroup().id, createGroup().id, createCondition().id]);
    expect(ids.size).toBe(3);
  });
});

describe("addNode", () => {
  it("appends a node to the target group without mutating the original", () => {
    const root = createGroup();
    const condition = createCondition("name");
    const next = addNode(root, root.id, condition);

    expect(next.children).toHaveLength(1);
    expect(next.children[0]).toBe(condition);
    expect(root.children).toHaveLength(0); // original untouched
    expect(next).not.toBe(root);
  });

  it("adds into a deeply nested group", () => {
    const inner = createGroup("OR");
    const root: Group = { ...createGroup(), children: [inner] };
    const condition = createCondition("level");
    const next = addNode(root, inner.id, condition);

    const found = findNode(next, inner.id) as Group;
    expect(found.children[0]).toBe(condition);
  });
});

describe("removeNode", () => {
  it("removes a nested node and leaves siblings intact", () => {
    const keep = createCondition("name");
    const drop = createCondition("age");
    const root: Group = { ...createGroup(), children: [keep, drop] };

    const next = removeNode(root, drop.id);
    expect(next.children).toHaveLength(1);
    expect(next.children[0]).toBe(keep);
  });

  it("never removes the root group", () => {
    const root = createGroup();
    expect(removeNode(root, root.id).id).toBe(root.id);
  });

  it("removes a node buried three levels deep", () => {
    const target = createCondition("deep");
    const lvl2: Group = { ...createGroup(), children: [target] };
    const lvl1: Group = { ...createGroup(), children: [lvl2] };
    const root: Group = { ...createGroup(), children: [lvl1] };

    const next = removeNode(root, target.id);
    expect(findNode(next, target.id)).toBeNull();
    expect(findNode(next, lvl2.id)).not.toBeNull();
  });
});

describe("updateCondition / updateGroupLogic / toggleCollapse", () => {
  it("patches only the targeted condition", () => {
    const a = createCondition("name");
    const b = createCondition("age");
    const root: Group = { ...createGroup(), children: [a, b] };

    const next = updateCondition(root, b.id, { operator: "gt", value: 18 });
    expect(next.children[1]).toMatchObject({ operator: "gt", value: 18 });
    expect(next.children[0]).toBe(a);
  });

  it("flips group logic", () => {
    const root = createGroup("AND");
    expect(updateGroupLogic(root, root.id, "OR").logic).toBe("OR");
  });

  it("toggles the collapsed flag", () => {
    const root = createGroup();
    const collapsed = toggleCollapse(root, root.id);
    expect(collapsed.collapsed).toBe(true);
    expect(toggleCollapse(collapsed, root.id).collapsed).toBe(false);
  });
});

describe("findNode / traverseTree", () => {
  it("finds nodes anywhere in the tree", () => {
    const target = createCondition("x");
    const inner: Group = { ...createGroup(), children: [target] };
    const root: Group = { ...createGroup(), children: [inner] };

    expect(findNode(root, target.id)).toBe(target);
    expect(findNode(root, "missing")).toBeNull();
  });

  it("visits every node and reports depth", () => {
    const leaf = createCondition("x");
    const inner: Group = { ...createGroup(), children: [leaf] };
    const root: Group = { ...createGroup(), children: [inner] };

    const visited: Array<[string, number]> = [];
    traverseTree(root, (n, depth) => visited.push([n.id, depth]));

    expect(visited).toEqual([
      [root.id, 0],
      [inner.id, 1],
      [leaf.id, 2],
    ]);
  });
});

describe("moveNode", () => {
  it("reorders a condition within its group", () => {
    const a = createCondition("a");
    const b = createCondition("b");
    const c = createCondition("c");
    const root: Group = { ...createGroup(), children: [a, b, c] };

    const next = moveNode(root, c.id, root.id, 0);
    expect(next.children.map((n) => n.id)).toEqual([c.id, a.id, b.id]);
  });

  it("moves a condition into a nested group", () => {
    const cond = createCondition("a");
    const inner = createGroup();
    const root: Group = { ...createGroup(), children: [cond, inner] };

    const next = moveNode(root, cond.id, inner.id, 0);
    expect(next.children).toHaveLength(1);
    expect((findNode(next, inner.id) as Group).children[0].id).toBe(cond.id);
  });

  it("refuses to move a group inside itself", () => {
    const inner = createGroup();
    const root: Group = { ...createGroup(), children: [inner] };
    const next = moveNode(root, inner.id, inner.id, 0);
    expect(next).toBe(root);
  });

  it("clamps an out-of-range index to the end", () => {
    const a = createCondition("a");
    const b = createCondition("b");
    const root: Group = { ...createGroup(), children: [a, b] };

    const next = moveNode(root, a.id, root.id, 99);
    expect(next.children.map((n) => n.id)).toEqual([b.id, a.id]);
  });
});
