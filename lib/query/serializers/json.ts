import { Group, QueryNode } from "@/lib/query/types";

// The query tree, pretty-printed for reading. Internal node ids and UI-only
// state (collapsed) are stripped: they're runtime bookkeeping — React keys and
// drag handles — not part of the logical query, so they only add noise here.
export function toJSON(tree: Group): string {
  return JSON.stringify(toReadable(tree), null, 2);
}

function toReadable(node: QueryNode): unknown {
  if (node.type === "group") {
    return {
      type: node.type,
      logic: node.logic,
      children: node.children.map(toReadable),
    };
  }
  return {
    type: node.type,
    field: node.field,
    operator: node.operator,
    value: node.value,
  };
}
