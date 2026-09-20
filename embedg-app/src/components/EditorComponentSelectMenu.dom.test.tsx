import { screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { COMPONENTS_V2_FLAG, useDocumentStore } from "../state/document";
import {
  currentComponents,
  editorUser,
  loadMessage,
  renderEditor,
} from "../test/editor";
import EditorComponents from "./EditorComponents";

vi.mock("../util/premium", () => ({
  usePremiumGuildFeatures: () => ({
    component_types: [1, 2, 3, 9, 10, 11, 12, 13, 14, 17],
    max_actions_per_component: 5,
  }),
  usePremiumUserFeatures: () => ({}),
}));

/** A row holding a select menu with the given option labels. */
function selectMenuMessage(labels: string[]) {
  return {
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [
      {
        type: 1,
        components: [
          {
            type: 3,
            placeholder: "Pick one",
            options: labels.map((label, i) => ({
              type: 3,
              label,
              action_set_id: `set-${i}`,
            })),
          },
        ],
      },
    ],
    actions: Object.fromEntries(
      labels.map((_, i) => [`set-${i}`, { actions: [] }]),
    ),
  };
}

function firstSelectMenu() {
  const components = currentComponents() as {
    components: { type: number; options?: { label: string }[] }[];
  }[];

  return components[0].components[0];
}

beforeEach(() => {
  loadMessage(selectMenuMessage(["One", "Two"]));
});

test("a select menu row added from the menu holds a select menu", async () => {
  loadMessage({ content: "", flags: COMPONENTS_V2_FLAG, components: [] });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().click(
    screen.getByRole("button", { name: /Add Component/ }),
  );
  await editorUser().click(screen.getByRole("button", { name: "Select Menu" }));

  expect(currentComponents()).toMatchObject([
    { type: 1, components: [{ type: 3, options: [] }] },
  ]);
});

test("adding an option gives it an action set", async () => {
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().click(screen.getByRole("button", { name: "Add Option" }));

  const options = firstSelectMenu().options ?? [];
  expect(options).toHaveLength(3);

  const added = options[2] as unknown as { action_set_id: string };
  expect(useDocumentStore.getState().actions[added.action_set_id]).toEqual({
    actions: [],
  });
});

test("typing an option label reaches the message", async () => {
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().type(screen.getAllByLabelText("Label")[0], "!");

  expect(firstSelectMenu().options?.[0].label).toBe("One!");
});

test("reordering options reorders them in the message", async () => {
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  // Only the first option can move down, the last only up.
  await editorUser().click(
    screen.getAllByRole("button", { name: "Move down" })[0],
  );

  expect(firstSelectMenu().options).toMatchObject([
    { label: "Two" },
    { label: "One" },
  ]);
});

test("removing an option drops its action set", async () => {
  renderEditor(<EditorComponents defaultCollapsed={false} />);
  const before = Object.keys(useDocumentStore.getState().actions);

  await editorUser().click(
    screen.getAllByRole("button", { name: "Remove" })[1],
  );

  expect(firstSelectMenu().options).toMatchObject([{ label: "Two" }]);
  const after = Object.keys(useDocumentStore.getState().actions);
  expect(after).toHaveLength(before.length - 1);
  expect(after).not.toContain("set-0");
});

test("clearing options empties the menu and its action sets", async () => {
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().click(
    screen.getByRole("button", { name: "Clear Options" }),
  );

  expect(firstSelectMenu().options).toEqual([]);
  expect(useDocumentStore.getState().actions).toEqual({});
});

test("duplicating an option copies it without sharing the action set", async () => {
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().click(
    screen.getAllByRole("button", { name: "Duplicate" })[1],
  );

  const options = (firstSelectMenu().options ?? []) as unknown as {
    label: string;
    action_set_id: string;
  }[];
  expect(options.map((o) => o.label)).toEqual(["One", "One", "Two"]);
  expect(options[0].action_set_id).not.toBe(options[1].action_set_id);
});
