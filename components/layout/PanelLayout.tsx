import { SchemaSidebar } from "./SchemaSidebar";
import { QueryBuilder } from "@/components/builder/QueryBuilder";

export function PanelLayout() {
  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      {/* Left ── Schema Browser */}
      <SchemaSidebar />

      {/* Center ── Query Builder Canvas */}
      <main
        className="flex-1 flex flex-col overflow-hidden min-w-0"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="h-8 px-4 flex items-center shrink-0 border-b"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Query Builder
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <QueryBuilder />
        </div>
      </main>

      {/* Right ── Live Preview + Results */}
      <aside
        className="w-[360px] shrink-0 border-l flex flex-col overflow-hidden"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="h-8 px-3 flex items-center shrink-0 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Live Preview
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Query output will appear here.
          </p>
        </div>
      </aside>
    </div>
  );
}
