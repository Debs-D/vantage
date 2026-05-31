import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PanelLayout } from "@/components/layout/PanelLayout";
import { useQueryStore } from "@/lib/store/query-store";
import { useUIStore } from "@/lib/store/ui-store";
import { createGroup } from "@/lib/query/tree";

beforeEach(() => {
  useQueryStore.setState({
    activeSchemaKey: "users",
    tree: createGroup("AND"),
    history: [],
    future: [],
    presets: [],
  });
  useUIStore.setState({ previewFormat: "sql" });
});

// Drives the real components end to end: store → builder UI → live serializer.
describe("building a query through the UI", () => {
  it("reflects a condition built via the panels in the SQL preview", async () => {
    const user = userEvent.setup();
    const { container } = render(<PanelLayout />);

    await user.click(screen.getByRole("button", { name: "+ Condition" }));
    await user.selectOptions(screen.getByLabelText("Field"), "age");
    await user.type(screen.getByLabelText("Value"), "30");

    const sql = container.querySelector("pre")?.textContent ?? "";
    expect(sql).toContain("FROM users");
    expect(sql).toContain("WHERE age = 30");
  });

  it("composes two conditions with the group's AND logic", async () => {
    const user = userEvent.setup();
    const { container } = render(<PanelLayout />);

    await user.click(screen.getByRole("button", { name: "+ Condition" }));
    await user.selectOptions(screen.getByLabelText("Field"), "age");
    await user.type(screen.getByLabelText("Value"), "18");

    await user.click(screen.getByRole("button", { name: "+ Condition" }));
    // Two conditions now — target the second one's controls.
    const fields = screen.getAllByLabelText("Field");
    await user.selectOptions(fields[1], "status");
    const values = screen.getAllByLabelText("Value");
    await user.selectOptions(values[1], "active");

    const sql = container.querySelector("pre")?.textContent ?? "";
    expect(sql).toContain("age = 18 AND status = 'active'");
  });
});
