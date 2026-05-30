"use client";

import { ConditionGroup } from "./ConditionGroup";
import { useQueryStore } from "@/lib/store/query-store";

// Entry point for the builder. The root is always a group, so the whole UI is
// just one ConditionGroup rendering itself recursively for every nested level.
export function QueryBuilder() {
  const rootId = useQueryStore((s) => s.tree.id);

  return (
    <div className="animate-fade-in">
      <ConditionGroup nodeId={rootId} depth={0} />
    </div>
  );
}
