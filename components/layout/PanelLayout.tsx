export function PanelLayout() {
  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      {/* Left ── Schema Browser */}
      <aside
        className="w-52 shrink-0 border-r flex flex-col overflow-hidden"
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
            Schema
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Schema fields will appear here.
          </p>
        </div>
      </aside>

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
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Build your query here.
          </p>
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
