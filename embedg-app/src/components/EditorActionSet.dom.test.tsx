import { screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { messageDocumentStore } from "../state/document";
import { editorUser, loadMessage, renderEditor } from "../test/editor";
import EditorActionSet from "./EditorActionSet";

vi.mock("../util/premium", () => ({
  usePremiumGuildFeatures: () => ({
    component_types: [1, 2, 3, 9, 10, 11, 12, 13, 14, 17],
    max_actions_per_component: 5,
  }),
  usePremiumUserFeatures: () => ({}),
}));

const SET_ID = "set-1";

function actions() {
  return messageDocumentStore.getState().actions[SET_ID]?.actions ?? [];
}

function textAction(id: number, text: string) {
  return {
    type: 1,
    id,
    text,
    public: false,
    allow_role_mentions: false,
  };
}

beforeEach(() => {
  loadMessage({
    content: "",
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Click", action_set_id: SET_ID },
        ],
      },
    ],
    actions: { [SET_ID]: { actions: [textAction(1, "first")] } },
  });
});

test("adding an action appends it to the set", async () => {
  renderEditor(<EditorActionSet setId={SET_ID} />);

  await editorUser().click(screen.getByRole("button", { name: "Add Action" }));

  expect(actions()).toHaveLength(2);
  expect(actions()[1]).toMatchObject({ type: 1, text: "" });
});

test("the response text reaches the action", async () => {
  renderEditor(<EditorActionSet setId={SET_ID} />);

  await editorUser().type(screen.getByLabelText("Response"), "!");

  expect(actions()[0]).toMatchObject({ text: "first!" });
});

test("changing the type swaps the action for that shape", async () => {
  renderEditor(<EditorActionSet setId={SET_ID} />);

  await editorUser().selectOptions(
    screen.getByRole("combobox", { name: "Type" }),
    "toggle_role",
  );

  // A role action carries a target instead of the text response's body.
  expect(actions()[0]).toMatchObject({ type: 2, target_id: "" });
  expect(actions()[0]).not.toHaveProperty("text");
});

test("removing an action takes it out of the set", async () => {
  loadMessage({
    content: "",
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Click", action_set_id: SET_ID },
        ],
      },
    ],
    actions: {
      [SET_ID]: { actions: [textAction(1, "first"), textAction(2, "second")] },
    },
  });
  renderEditor(<EditorActionSet setId={SET_ID} />);

  await editorUser().click(
    screen.getAllByRole("button", { name: "Remove" })[0],
  );

  expect(actions()).toMatchObject([{ text: "second" }]);
});

test("clearing empties the set", async () => {
  renderEditor(<EditorActionSet setId={SET_ID} />);

  await editorUser().click(
    screen.getByRole("button", { name: "Clear Actions" }),
  );

  expect(actions()).toEqual([]);
});

test("the add button stops at the plan's action limit", async () => {
  loadMessage({
    content: "",
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Click", action_set_id: SET_ID },
        ],
      },
    ],
    actions: {
      [SET_ID]: {
        actions: Array.from({ length: 5 }, (_, i) => textAction(i, `a${i}`)),
      },
    },
  });
  renderEditor(<EditorActionSet setId={SET_ID} />);

  expect(screen.getByRole("button", { name: "Add Action" })).toBeDisabled();
});
