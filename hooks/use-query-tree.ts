import { useQueryStore } from "@/lib/store/query-store";
import { findNode } from "@/lib/query/tree";
import { SCHEMAS } from "@/lib/schema/schemas";
import { QueryNode } from "@/lib/query/types";
import { SchemaDefinition } from "@/lib/schema/types";

// Typed action bundle for the builder components. Each action is a stable
// reference from the store, so pulling them this way never causes re-renders —
// only the node and schema selectors below do, and only when their slice moves.
export function useQueryTree() {
  const addCondition = useQueryStore((s) => s.addCondition);
  const addGroup = useQueryStore((s) => s.addGroup);
  const removeNode = useQueryStore((s) => s.removeNode);
  const updateCondition = useQueryStore((s) => s.updateCondition);
  const updateGroupLogic = useQueryStore((s) => s.updateGroupLogic);
  const toggleCollapse = useQueryStore((s) => s.toggleCollapse);
  const moveNode = useQueryStore((s) => s.moveNode);

  return {
    addCondition,
    addGroup,
    removeNode,
    updateCondition,
    updateGroupLogic,
    toggleCollapse,
    moveNode,
  };
}

// Subscribes to a single node by id. Because the tree is rebuilt immutably,
// unaffected nodes keep their object identity — so a component only re-renders
// when its own node (or an ancestor) actually changes.
export function useNode(id: string): QueryNode | null {
  return useQueryStore((s) => findNode(s.tree, id));
}

export function useActiveSchema(): SchemaDefinition {
  return useQueryStore((s) => SCHEMAS[s.activeSchemaKey]);
}
