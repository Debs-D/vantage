import { SchemaSidebar } from "./SchemaSidebar";
import { QueryBuilder } from "@/components/builder/QueryBuilder";
import { BuilderToolbar } from "@/components/builder/BuilderToolbar";
import { LivePreview } from "@/components/preview/LivePreview";
import { ResultsPanel } from "@/components/results/ResultsPanel";

export function PanelLayout() {
  return (
    // Stacked on small screens, three columns from lg up.
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
      {/* Left ── Schema Browser (hidden on small screens) */}
      <SchemaSidebar />

      {/* Center ── Query Builder Canvas */}
      <main
        className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="h-8 px-4 flex items-center shrink-0 border-b"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <BuilderToolbar />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <QueryBuilder />
        </div>
      </main>

      {/* Right ── Live Preview + Results */}
      <aside
        className="w-full lg:w-[360px] flex-1 lg:flex-none min-h-0 border-t lg:border-t-0 lg:border-l flex flex-col overflow-hidden"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <LivePreview />
        <ResultsPanel />
      </aside>
    </div>
  );
}
