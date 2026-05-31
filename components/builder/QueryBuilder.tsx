"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ConditionGroup } from "./ConditionGroup";
import { useQueryStore } from "@/lib/store/query-store";
import { findParent } from "@/lib/query/tree";

// Entry point for the builder. The root is always a group, so the whole UI is
// just one ConditionGroup rendering itself recursively for every nested level.
// A single DndContext spans the tree; each group is its own SortableContext.
export function QueryBuilder() {
  const rootId = useQueryStore((s) => s.tree.id);
  const moveNode = useQueryStore((s) => s.moveNode);

  // A small activation distance means a click on a select/button isn't read as a
  // drag — only a deliberate pull starts one.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    // Drop the dragged node where the node it landed on currently sits. Reading
    // the tree fresh avoids any stale closure over an earlier render.
    const tree = useQueryStore.getState().tree;
    const parent = findParent(tree, String(over.id));
    if (!parent) return;
    const index = parent.children.findIndex((c) => c.id === over.id);
    moveNode(String(active.id), parent.id, index);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div className="animate-fade-in">
        <ConditionGroup nodeId={rootId} depth={0} />
      </div>
    </DndContext>
  );
}
