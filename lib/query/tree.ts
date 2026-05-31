import { nanoid } from "nanoid";
import {
  Condition,
  Group,
  LogicOperator,
  OperatorKey,
  QueryNode,
} from "./types";

// Every operation here is pure: it returns a brand new tree and never mutates
// its input. That immutability is what makes undo/redo a matter of keeping old
// snapshots around, with no risk of stale references.

export function createGroup(logic: LogicOperator = "AND"): Group {
  return { id: nanoid(), type: "group", logic, children: [] };
}

export function createCondition(
  field = "",
  operator: OperatorKey = "equals"
): Condition {
  return { id: nanoid(), type: "condition", field, operator, value: null };
}

// Bottom-up rebuild: recurse into children first, then apply `fn` to the node.
// Used for in-place edits where the tree shape is unchanged.
function rebuild(node: QueryNode, fn: (node: QueryNode) => QueryNode): QueryNode {
  if (node.type === "group") {
    return fn({ ...node, children: node.children.map((c) => rebuild(c, fn)) });
  }
  return fn(node);
}

export function addNode(tree: Group, parentId: string, node: QueryNode): Group {
  return rebuild(tree, (n) =>
    n.type === "group" && n.id === parentId
      ? { ...n, children: [...n.children, node] }
      : n
  ) as Group;
}

export function removeNode(tree: Group, nodeId: string): Group {
  const prune = (group: Group): Group => ({
    ...group,
    children: group.children
      .filter((c) => c.id !== nodeId)
      .map((c) => (c.type === "group" ? prune(c) : c)),
  });
  // The root is never removed — only its descendants can be pruned.
  return prune(tree);
}

export function updateCondition(
  tree: Group,
  id: string,
  patch: Partial<Pick<Condition, "field" | "operator" | "value">>
): Group {
  return rebuild(tree, (n) =>
    n.type === "condition" && n.id === id ? { ...n, ...patch } : n
  ) as Group;
}

export function updateGroupLogic(
  tree: Group,
  id: string,
  logic: LogicOperator
): Group {
  return rebuild(tree, (n) =>
    n.type === "group" && n.id === id ? { ...n, logic } : n
  ) as Group;
}

export function toggleCollapse(tree: Group, id: string): Group {
  return rebuild(tree, (n) =>
    n.type === "group" && n.id === id ? { ...n, collapsed: !n.collapsed } : n
  ) as Group;
}

export function findNode(tree: Group, id: string): QueryNode | null {
  let found: QueryNode | null = null;
  traverseTree(tree, (n) => {
    if (n.id === id) found = n;
  });
  return found;
}

export function traverseTree(
  node: QueryNode,
  visitor: (node: QueryNode, depth: number) => void,
  depth = 0
): void {
  visitor(node, depth);
  if (node.type === "group") {
    node.children.forEach((c) => traverseTree(c, visitor, depth + 1));
  }
}

// Total number of conditions anywhere in the tree — used to label snapshots.
export function countConditions(tree: Group): number {
  let count = 0;
  traverseTree(tree, (n) => {
    if (n.type === "condition") count += 1;
  });
  return count;
}

// The group that directly contains `id`, or null for the root / a missing id.
// Drag-and-drop uses this to resolve where a dropped node should land.
export function findParent(tree: Group, id: string): Group | null {
  let parent: Group | null = null;
  traverseTree(tree, (n) => {
    if (n.type === "group" && n.children.some((c) => c.id === id)) parent = n;
  });
  return parent;
}

function isDescendant(group: Group, id: string): boolean {
  return group.children.some(
    (c) => c.id === id || (c.type === "group" && isDescendant(c, id))
  );
}

// Reorder for drag-and-drop: detach `nodeId`, then insert it into the group
// `targetId` at `index`. Refuses moves that would put a group inside itself.
export function moveNode(
  tree: Group,
  nodeId: string,
  targetId: string,
  index: number
): Group {
  const node = findNode(tree, nodeId);
  if (!node || node.id === tree.id) return tree;
  if (node.type === "group" && (targetId === nodeId || isDescendant(node, targetId))) {
    return tree;
  }

  const detached = removeNode(tree, nodeId);

  const insert = (group: Group): Group => {
    if (group.id === targetId) {
      const children = [...group.children];
      const at = Math.max(0, Math.min(index, children.length));
      children.splice(at, 0, node);
      return { ...group, children };
    }
    return {
      ...group,
      children: group.children.map((c) => (c.type === "group" ? insert(c) : c)),
    };
  };

  return insert(detached);
}
