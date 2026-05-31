import { useEffect } from "react";
import { useQueryStore } from "@/lib/store/query-store";
import { useResultsStore } from "@/lib/store/results-store";
import { useUIStore } from "@/lib/store/ui-store";
import { downloadQuery } from "@/lib/query/io";

// Global keyboard shortcuts. Mounted once near the top of the tree; it subscribes
// to window keydown and dispatches into the stores — no component state involved.
export function useKeyboard() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const query = useQueryStore.getState();

      if (mod && key === "z" && !e.shiftKey) {
        e.preventDefault();
        query.undo();
      } else if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
        e.preventDefault();
        query.redo();
      } else if (mod && e.key === "Enter") {
        e.preventDefault();
        useResultsStore.getState().execute();
      } else if (mod && key === "s") {
        e.preventDefault();
        const name = window.prompt("Save query as preset:");
        if (name) query.savePreset(name.trim() || "Untitled");
      } else if (mod && key === "e") {
        e.preventDefault();
        downloadQuery(query.tree, query.activeSchemaKey);
      } else if (e.key === "?" && !isTyping(e.target)) {
        e.preventDefault();
        const ui = useUIStore.getState();
        ui.setShortcutsOpen(!ui.shortcutsOpen);
      } else if (e.key === "Escape") {
        useUIStore.getState().setShortcutsOpen(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}

// "?" should only open the help when not typing into a field.
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "SELECT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}
