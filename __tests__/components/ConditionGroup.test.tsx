import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryBuilder } from "@/components/builder/QueryBuilder";
import { useQueryStore } from "@/lib/store/query-store";
import { createCondition, createGroup } from "@/lib/query/tree";
import { Group } from "@/lib/query/types";

const state = useQueryStore.getState;

function seed(tree: Group) {
  useQueryStore.setState({
    activeSchemaKey: "users",
    tree,
    history: [],
    presets: [],
  });
}

beforeEach(() => seed(createGroup("AND")));

describe("recursive rendering", () => {
  it("renders a group nested three levels deep", () => {
    const condition = createCondition("name");
    const level2: Group = { ...createGroup("OR"), children: [condition] };
    const level1: Group = { ...createGroup("AND"), children: [level2] };
    seed({ ...createGroup("AND"), children: [level1] });

    render(<QueryBuilder />);

    // Root + two nested groups each render their own logic toggle.
    expect(screen.getAllByRole("group", { name: "Match logic" })).toHaveLength(3);
    // The leaf condition renders its field selector.
    expect(screen.getByLabelText("Field")).toBeInTheDocument();
  });
});

describe("adding and removing", () => {
  it("adds a condition to the group", async () => {
    render(<QueryBuilder />);
    expect(state().tree.children).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: "+ Condition" }));
    expect(state().tree.children).toHaveLength(1);
    expect(state().tree.children[0].type).toBe("condition");
  });

  it("adds a nested group", async () => {
    render(<QueryBuilder />);
    await userEvent.click(screen.getByRole("button", { name: "+ Group" }));

    expect(state().tree.children).toHaveLength(1);
    expect(state().tree.children[0].type).toBe("group");
  });

  it("removes a condition", async () => {
    seed({ ...createGroup("AND"), children: [createCondition("name")] });
    render(<QueryBuilder />);

    await userEvent.click(screen.getByLabelText("Remove condition"));
    expect(state().tree.children).toHaveLength(0);
  });
});

describe("logic toggle", () => {
  it("switches the group between AND and OR", async () => {
    seed({ ...createGroup("AND"), children: [createCondition("name")] });
    render(<QueryBuilder />);
    expect(state().tree.logic).toBe("AND");

    await userEvent.click(screen.getByRole("button", { name: "OR" }));
    expect(state().tree.logic).toBe("OR");
  });
});

describe("collapse", () => {
  it("hides children when collapsed", async () => {
    seed({ ...createGroup("AND"), children: [createCondition("name")] });
    render(<QueryBuilder />);
    expect(screen.getByLabelText("Field")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Collapse group"));
    expect(screen.queryByLabelText("Field")).not.toBeInTheDocument();
  });
});
