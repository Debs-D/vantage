"use client";

import { useState } from "react";
import { CollapsibleSection } from "./CollapsibleSection";
import { useQueryStore } from "@/lib/store/query-store";
import { useMounted } from "@/hooks/use-mounted";
import { SCHEMAS } from "@/lib/schema/schemas";

export function PresetsSection() {
  // Presets are restored from localStorage, so they only render after mount to
  // keep the server and first client render identical.
  const mounted = useMounted();
  const presets = useQueryStore((s) => s.presets);
  const savePreset = useQueryStore((s) => s.savePreset);
  const loadPreset = useQueryStore((s) => s.loadPreset);
  const deletePreset = useQueryStore((s) => s.deletePreset);

  const [name, setName] = useState("");

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    savePreset(trimmed);
    setName("");
  };

  return (
    <CollapsibleSection title="Presets" count={mounted ? presets.length : undefined}>
      <form
        className="flex gap-1 py-1"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Save current as…"
          aria-label="Preset name"
          className="flex-1 min-w-0 h-7 px-2 text-xs rounded border bg-[var(--surface)]
            text-[var(--text)] placeholder:text-[var(--text-muted)]
            border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="px-2 h-7 rounded text-xs border border-[var(--border)] text-[var(--text-secondary)]
            hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </form>

      {mounted && presets.length === 0 && (
        <p className="text-[11px] px-1 py-1" style={{ color: "var(--text-muted)" }}>
          No saved presets yet.
        </p>
      )}

      {mounted && (
        <ul className="flex flex-col gap-0.5">
          {presets.map((preset) => (
            <li key={preset.id} className="group flex items-center gap-1">
              <button
                type="button"
                onClick={() => loadPreset(preset.id)}
                className="flex-1 min-w-0 flex items-center justify-between gap-2 px-2 h-7 rounded text-left
                  hover:bg-[var(--surface-raised)] transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
              >
                <span className="text-xs truncate" style={{ color: "var(--text)" }}>
                  {preset.name}
                </span>
                <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>
                  {SCHEMAS[preset.schemaKey]?.label ?? preset.schemaKey}
                </span>
              </button>
              <button
                type="button"
                onClick={() => deletePreset(preset.id)}
                aria-label={`Delete preset ${preset.name}`}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100
                  text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}
