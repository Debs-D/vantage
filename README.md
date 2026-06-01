# Vantage — Visual Query Builder

> Query without syntax.

Vantage is a visual query builder for constructing arbitrarily nested boolean
queries against structured data — no SQL knowledge required. You build a query
by clicking fields and choosing operators; Vantage shows you the equivalent SQL,
MongoDB filter, and raw JSON in real time, and runs the query against sample
datasets so you can see exactly what it matches.

I designed it to feel like a developer tool you'd actually pay for — closer to
Linear or the Vercel dashboard than a hackathon demo. Light mode is the default
on purpose: most tools reach for dark first, and I wanted to show that a light,
editorial layout with deliberate whitespace can feel just as premium.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run test     # vitest, ~85 tests
npm run build    # production build
```

Deployed on Vercel — it builds straight from the default Next.js output, so no
extra deployment config is needed.

## The core idea: one recursive data structure

Everything in the app is built around a single recursive type. A query is a
tree; the root is always a group, a group holds children, and each child is
either a condition or another group:

```ts
interface Condition {
  id: string;
  type: "condition";
  field: string;
  operator: OperatorKey;
  value: ConditionValue;
}

interface Group {
  id: string;
  type: "group";
  logic: "AND" | "OR";
  children: QueryNode[]; // recursive — a child is a Condition or a Group
  collapsed?: boolean;
}

type QueryNode = Condition | Group;
```

Because the structure is recursive, nesting depth is unlimited and there are no
special cases. Every feature — rendering, serialization, validation, execution,
drag-and-drop — is just a different walk over this same tree.

## Architecture

The codebase is split into a pure logic layer and a UI layer, and they don't
leak into each other.

```
lib/
  query/        # pure, React-free logic
    types.ts        # the recursive model + the canonical type→operator map
    tree.ts         # immutable tree operations (add/remove/update/move/find)
    validator.ts    # validation engine
    serializers/    # tree → SQL / MongoDB / JSON
    io.ts           # export/import with strict parsing
  schema/         # field/operator metadata for the four datasets
  data/           # mock datasets + the query execution engine
  store/          # Zustand stores (query, ui, results)
components/
  builder/      # the recursive query builder UI
  preview/      # live multi-format preview
  results/      # execution results
  layout/       # app shell, schema sidebar, presets, history
hooks/          # use-query-tree, use-keyboard, use-mounted
```

### Pure functional core

Everything in `lib/query/` is plain TypeScript with zero React dependencies.
The tree operations are all immutable — every function returns a brand new tree
and never mutates its input:

```ts
addNode(tree, parentId, node)         → new tree
removeNode(tree, nodeId)              → new tree
moveNode(tree, nodeId, target, index) → new tree
```

That immutability is what makes undo/redo trivial (more below), and it means the
whole engine is testable in complete isolation — the serializer and execution
tests never touch a component.

### Schema-driven everything

A dataset is described once as a plain object, and the rest of the app derives
from it — which fields exist, what input widget each one shows, which operators
are valid, and how values are validated:

```ts
fieldTypesOf(schema)   // → { age: "number", status: "enum", ... }
```

Both the validator and the execution engine depend only on this `field → type`
map, not on the full schema object. Keeping that dependency thin is why they're
trivially testable. Adding a new dataset is genuinely one object declaration.

The single source of truth for which operators a field type allows lives in
`OPERATORS_BY_TYPE` in the query layer. The schema layer's `operators.ts` adds
display labels and operand counts *on top* of that map rather than duplicating
it, so the two can never drift apart.

## Recursive rendering

The builder UI mirrors the data structure exactly. `ConditionGroup` renders a
group by mapping its children — and for each child, it renders a `ConditionRule`
if the child is a condition, or **another `ConditionGroup`** if it's a group:

```tsx
group.children.map((child) =>
  child.type === "group"
    ? <ConditionGroup nodeId={child.id} depth={depth + 1} />
    : <ConditionRule nodeId={child.id} />
);
```

The component doesn't know or care how deep it will go. It just renders its
children, and recursion handles the rest. Nesting depth is visually reinforced
by a coral left-border bar that deepens with each level.

## State management

I used Zustand rather than Redux — same unidirectional pattern, far less
boilerplate, smaller bundle. There are three stores:

- **query-store** — the live tree, undo/redo stacks, and saved presets. Its
  actions are thin wrappers over the pure `lib/query/tree` functions; the store
  holds *state and history*, the logic stays in the pure layer.
- **ui-store** — theme, active preview format, modal state.
- **results-store** — execution state, so the Execute button and the Ctrl+Enter
  shortcut drive one shared code path with no stale closures.

### Undo/redo for free

Because every mutation produces a new immutable tree, history is just a stack of
snapshots. A single `commit()` helper swaps in the new tree, pushes the previous
one onto the history stack (capped at 20), and clears the redo stack. Undo pops
history; redo pops the future. No diffing, no inverse operations.

### Persistence

Saved presets are persisted to `localStorage` via Zustand's `persist`
middleware (`partialize`d to presets only — the live query and history are
session state). A no-op storage fallback keeps server-side rendering from ever
touching `localStorage`, and a `useMounted` hook (built on
`useSyncExternalStore`, not a state-in-effect flag) gates the presets list so
there's no hydration mismatch.

## The serializers and execution engine

All four tree consumers — the SQL, MongoDB, and JSON serializers and the
execution engine — are the same recursive descent: walk the tree, recurse into
groups, and combine children with the group's AND/OR logic.

- **SQL** parenthesizes every nested group so AND/OR precedence is always
  explicit, quotes values according to their field type, and doubles embedded
  single quotes (standard escaping).
- **MongoDB** maps operators to `$gt`/`$regex`/`$in`/etc., builds `$and`/`$or`
  arrays, and collapses single-child groups so the output reads like a filter
  you'd actually write.
- **Execution** filters the sample dataset row by row; `every`/`some` map
  directly onto AND/OR.

Syntax highlighting in the preview is hand-rolled — one alternation regex per
language, no Prism or highlight.js. That keeps the bundle small; the trade-off
is that it highlights the formats I emit rather than being a general lexer,
which is exactly the scope I need.

## Performance

- **`React.memo` on `ConditionRule` and `ConditionGroup`.** Each row subscribes
  to its own node by id, and because the tree is rebuilt immutably, unaffected
  nodes keep their object identity — so editing or dragging one row doesn't
  re-render its siblings. Memo stops the cascade when an unrelated sibling
  updates a shared parent. I deliberately *didn't* memoize everything;
  blanket memoization adds overhead and is an anti-pattern.
- **`useMemo` on serializer output**, keyed on `[tree, schema, format]`, so the
  preview only re-serializes when something it depends on changes.
- **Stable keys** are always node ids, never array indices, so React reconciles
  correctly across reorders.
- **`content-visibility: auto`** on result cards skips layout/paint for
  off-screen rows in long result lists.

## Other interactions

- **Drag-and-drop** reordering (dnd-kit). The handle is isolated in one
  `SortableItem` wrapper — the only element wired to the sensors — so clicking a
  dropdown never starts a drag. Drops reuse the pure `moveNode`.
- **Keyboard shortcuts:** undo/redo, execute (Ctrl+Enter), save preset, export,
  and `?` for the shortcuts help.
- **Export/Import:** export wraps the query with the dataset it targets; import
  validates the entire tree structure recursively and rejects malformed files
  with a readable message.
- **Inline validation:** invalid fields/values get a red border at the row, the
  preview shows a warning banner, and Execute is disabled with a tooltip until
  the query is runnable.

## Testing

~85 tests with Vitest + React Testing Library, covering the tree operations,
validator, all serializers, the execution engine, the store (including undo/redo
and presets), export/import parsing, recursive component rendering, and an
end-to-end test that builds a query through the actual UI and asserts the
generated SQL.

## Trade-offs

- **Sample datasets, not a real database.** Execution runs in-memory against
  deterministic mock data so the demo is self-contained and the tests can assert
  exact results.
- **Same-context drag-and-drop.** Reordering within and across groups is
  supported; I didn't build a separate drag-overlay layer since the inline
  transform reads clearly enough.
- **History shows step + condition count, not timestamps.** History is stored as
  plain tree snapshots to keep undo trivial; I judged timestamps not worth
  complicating that.
- **Light-mode-first** is an intentional design stance, with full dark mode
  support behind the toggle.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Zustand · dnd-kit ·
Vitest + React Testing Library · deployed on Vercel.
