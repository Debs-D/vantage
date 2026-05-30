import { create } from "zustand";
import { nanoid } from "nanoid";
import {
  Condition,
  Group,
  LogicOperator,
  OPERATORS_BY_TYPE,
  OperatorKey,
} from "@/lib/query/types";
import * as tree from "@/lib/query/tree";
import { SCHEMAS } from "@/lib/schema/schemas";

const HISTORY_LIMIT = 20;
const DEFAULT_SCHEMA = "users";

export interface Preset {
  id: string;
  name: string;
  schemaKey: string;
  tree: Group;
}

type ConditionPatch = Partial<Pick<Condition, "field" | "operator" | "value">>;

interface QueryState {
  activeSchemaKey: string;
  tree: Group;
  history: Group[];
  presets: Preset[];

  setSchema: (key: string) => void;
  addCondition: (parentId: string, field?: string) => void;
  addGroup: (parentId: string, logic?: LogicOperator) => void;
  removeNode: (id: string) => void;
  updateCondition: (id: string, patch: ConditionPatch) => void;
  updateGroupLogic: (id: string, logic: LogicOperator) => void;
  toggleCollapse: (id: string) => void;
  moveNode: (nodeId: string, targetId: string, index: number) => void;
  undo: () => void;
  clear: () => void;

  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
}

export const useQueryStore = create<QueryState>((set, get) => {
  // Every mutation routes through here: it swaps in the new tree and snapshots
  // the previous one onto the history stack (capped), which is all undo needs.
  const commit = (next: Group) =>
    set((s) => ({
      tree: next,
      history: [...s.history, s.tree].slice(-HISTORY_LIMIT),
    }));

  return {
    activeSchemaKey: DEFAULT_SCHEMA,
    tree: tree.createGroup("AND"),
    history: [],
    presets: [],

    setSchema: (key) =>
      // Switching schema invalidates the current query, so start clean.
      set({ activeSchemaKey: key, tree: tree.createGroup("AND"), history: [] }),

    addCondition: (parentId, field = "") => {
      const operator = field
        ? defaultOperator(get().activeSchemaKey, field)
        : "equals";
      commit(
        tree.addNode(get().tree, parentId, tree.createCondition(field, operator))
      );
    },

    addGroup: (parentId, logic = "AND") =>
      commit(tree.addNode(get().tree, parentId, tree.createGroup(logic))),

    removeNode: (id) => commit(tree.removeNode(get().tree, id)),

    updateCondition: (id, patch) =>
      commit(tree.updateCondition(get().tree, id, patch)),

    updateGroupLogic: (id, logic) =>
      commit(tree.updateGroupLogic(get().tree, id, logic)),

    toggleCollapse: (id) => commit(tree.toggleCollapse(get().tree, id)),

    moveNode: (nodeId, targetId, index) =>
      commit(tree.moveNode(get().tree, nodeId, targetId, index)),

    undo: () =>
      set((s) => {
        if (s.history.length === 0) return s;
        const history = [...s.history];
        const previous = history.pop()!;
        return { tree: previous, history };
      }),

    clear: () => commit(tree.createGroup("AND")),

    savePreset: (name) =>
      set((s) => ({
        presets: [
          ...s.presets,
          { id: nanoid(), name, schemaKey: s.activeSchemaKey, tree: s.tree },
        ],
      })),

    loadPreset: (id) =>
      set((s) => {
        const preset = s.presets.find((p) => p.id === id);
        if (!preset) return s;
        return {
          activeSchemaKey: preset.schemaKey,
          tree: preset.tree,
          history: [...s.history, s.tree].slice(-HISTORY_LIMIT),
        };
      }),

    deletePreset: (id) =>
      set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),
  };
});

// Picks the first operator the field's type allows, so a freshly added
// condition is already coherent rather than mismatched.
function defaultOperator(schemaKey: string, field: string): OperatorKey {
  const def = SCHEMAS[schemaKey]?.fields.find((f) => f.key === field);
  return def ? OPERATORS_BY_TYPE[def.type][0] : "equals";
}
