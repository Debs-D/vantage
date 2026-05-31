"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Select } from "@/components/ui";
import { useUIStore, type Theme } from "@/lib/store/ui-store";
import { useQueryStore } from "@/lib/store/query-store";
import { SCHEMA_LIST } from "@/lib/schema/schemas";
import { useKeyboard } from "@/hooks/use-keyboard";
import { downloadQuery, readQueryFile } from "@/lib/query/io";
import { ShortcutsModal } from "@/components/ShortcutsModal";

function MoonIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function AppHeader() {
  useKeyboard();

  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const setShortcutsOpen = useUIStore((s) => s.setShortcutsOpen);

  const activeSchemaKey = useQueryStore((s) => s.activeSchemaKey);
  const setSchema = useQueryStore((s) => s.setSchema);
  const tree = useQueryStore((s) => s.tree);
  const loadQuery = useQueryStore((s) => s.loadQuery);

  const fileInput = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Restore the saved theme once on the client. The server and first client
  // render both use the default ("light"), so this never causes a mismatch.
  useEffect(() => {
    const saved = localStorage.getItem("vantage-theme") as Theme | null;
    if (saved) setTheme(saved);
  }, [setTheme]);

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { schemaKey, tree: imported } = await readQueryFile(file);
      loadQuery(schemaKey, imported);
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not import file.");
      setTimeout(() => setImportError(null), 4000);
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <>
      <header
        className="h-11 shrink-0 flex items-center justify-between px-4 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold tracking-[0.2em] uppercase text-coral">
            Vantage
          </span>
          <span
            className="text-[11px] hidden sm:block"
            style={{ color: "var(--text-muted)" }}
          >
            / Query without syntax
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-semibold uppercase tracking-widest hidden md:block"
              style={{ color: "var(--text-muted)" }}
            >
              Dataset
            </span>
            <Select
              value={activeSchemaKey}
              onChange={(e) => setSchema(e.target.value)}
              className="h-7 w-32"
              aria-label="Active dataset"
            >
              {SCHEMA_LIST.map((schema) => (
                <option key={schema.key} value={schema.key}>
                  {schema.label}
                </option>
              ))}
            </Select>
          </label>

          <div className="w-px h-5" style={{ background: "var(--border)" }} />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => downloadQuery(tree, activeSchemaKey)}
            title="Export query as JSON (Ctrl+E)"
          >
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInput.current?.click()}
            title="Import a query JSON file"
          >
            Import
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => onImportFile(e.target.files?.[0])}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            ?
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
            <span className="hidden sm:inline text-xs">
              {theme === "light" ? "Dark" : "Light"}
            </span>
          </Button>
        </div>
      </header>

      {importError && (
        <div
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded border text-xs shadow-lg animate-slide-in"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "#dc2626",
          }}
          role="alert"
        >
          Import failed: {importError}
        </div>
      )}

      <ShortcutsModal />
    </>
  );
}
