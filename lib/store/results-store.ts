import { create } from "zustand";
import { useQueryStore } from "@/lib/store/query-store";
import { SCHEMAS, fieldTypesOf } from "@/lib/schema/schemas";
import { DATASETS } from "@/lib/data/datasets";
import { executeQuery } from "@/lib/data/executor";
import { validateTree } from "@/lib/query/validator";

type Row = Record<string, unknown>;
export type ResultStatus = "idle" | "running" | "done" | "error";

interface ResultsState {
  status: ResultStatus;
  rows: Row[];
  error: string | null;
  execute: () => void;
}

const EXECUTE_DELAY = 150;

export const useResultsStore = create<ResultsState>((set) => ({
  status: "idle",
  rows: [],
  error: null,

  // Reads the live query straight from the query store, so the button and the
  // keyboard shortcut share one execution path with no stale closures.
  execute: () => {
    const { tree, activeSchemaKey } = useQueryStore.getState();
    const schema = SCHEMAS[activeSchemaKey];

    // An empty group means "match all" and is runnable; any other validation
    // error would make the result meaningless, so it blocks execution.
    const blocking = validateTree(tree, fieldTypesOf(schema)).filter(
      (e) => e.type !== "empty-group"
    );
    if (blocking.length > 0) {
      set({ status: "error", error: blocking[0].message, rows: [] });
      return;
    }

    set({ status: "running", error: null });
    // Brief delay so the loading state reads as a real round-trip.
    setTimeout(() => {
      const rows = executeQuery(tree, DATASETS[activeSchemaKey], schema);
      set({ status: "done", rows, error: null });
    }, EXECUTE_DELAY);
  },
}));
