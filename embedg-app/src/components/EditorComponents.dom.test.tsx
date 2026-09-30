import { screen } from "@testing-library/react";

import { afterEach, beforeEach, expect, test, vi } from "vitest";

// Actions per button are limited by the guild's premium features, which come
// from the API the tests do not talk to.
vi.mock("../util/premium", () => ({
  usePremiumGuildFeatures: () => ({
    max_actions_per_component: 5,
  }),
  usePremiumUserFeatures: () => ({}),
}));
import { COMPONENTS_V2_FLAG } from "../state/document";
import { useSendSettingsStore } from "../state/sendSettings";
import {
  currentComponents,
  editorUser,
  loadMessage,
  renderEditor,
  targetFluxerWebhook,
} from "../test/editor";
import EditorComponents from "./EditorComponents";

beforeEach(() => {
  loadMessage({ content: "", flags: COMPONENTS_V2_FLAG, components: [] });
});

afterEach(() => {
  useSendSettingsStore.setState({ mode: "webhook", webhookUrl: null });
});

test("there are no components to add for Fluxer", () => {
  targetFluxerWebhook();
  loadMessage({ content: "Hi" });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  expect(screen.queryByText("Components")).toBeNull();
});

test("components already in the message stay for Fluxer, so they can be removed", () => {
  targetFluxerWebhook();
  loadMessage({
    content: "Hi",
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 5, label: "Go", url: "https://example.com" },
        ],
      },
    ],
  });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  expect(screen.getByText(/Fluxer doesn't support components/)).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Clear Components" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Add Component/ })).toBeNull();
});

test("adding a button row puts an action row in the message", async () => {
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().click(
    screen.getByRole("button", { name: /Add Component/ }),
  );
  await editorUser().click(screen.getByRole("button", { name: "Button Row" }));

  expect(currentComponents()).toMatchObject([{ type: 1, components: [] }]);
  expect(screen.getByText("Action Row")).toBeInTheDocument();
});

test.each([
  ["channel", 2],
  // Webhooks can only send link buttons.
  ["webhook", 5],
] as const)(
  "a button added to a row reaches the message when sending to a %s",
  async (mode, style) => {
    useSendSettingsStore.setState({ mode });
    loadMessage({
      content: "",
      flags: COMPONENTS_V2_FLAG,
      components: [{ type: 1, components: [] }],
    });
    renderEditor(<EditorComponents defaultCollapsed={false} />);

    await editorUser().click(
      screen.getByRole("button", { name: "Add Button" }),
    );

    expect(currentComponents()).toMatchObject([
      { type: 1, components: [{ type: 2, style }] },
    ]);
  },
);

test("typing a label updates the button in the message", async () => {
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [
      {
        type: 1,
        components: [{ type: 2, style: 1, label: "", action_set_id: "set-1" }],
      },
    ],
    actions: { "set-1": { actions: [] } },
  });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().type(screen.getByLabelText("Label"), "Click me");

  expect(currentComponents()).toMatchObject([
    { components: [{ label: "Click me" }] },
  ]);
});

test("the add button stops at the row limit of five", async () => {
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [
      {
        type: 1,
        components: Array.from({ length: 5 }, (_, i) => ({
          type: 2,
          style: 1,
          label: `B${i}`,
          action_set_id: `set-${i}`,
        })),
      },
    ],
  });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  expect(screen.getByRole("button", { name: "Add Button" })).toBeDisabled();
});

test("clearing a row removes its buttons from the message", async () => {
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "One", action_set_id: "set-1" },
          { type: 2, style: 1, label: "Two", action_set_id: "set-2" },
        ],
      },
    ],
  });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().click(
    screen.getByRole("button", { name: "Clear Buttons" }),
  );

  expect(currentComponents()).toMatchObject([{ components: [] }]);
});

test("a nested container renders its children through the dispatch", async () => {
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [
      {
        type: 17,
        components: [
          { type: 10, content: "Inside the container" },
          { type: 14, divider: true, spacing: 1 },
        ],
      },
    ],
  });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  expect(screen.getByText("Text Display")).toBeInTheDocument();
  expect(screen.getByText("Separator")).toBeInTheDocument();
});

test("swapping a section accessory replaces it in the message", async () => {
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [
      {
        type: 9,
        components: [{ type: 10, content: "Section text" }],
        accessory: { type: 11, media: { url: "https://message.style/a.png" } },
      },
    ],
  });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().selectOptions(
    screen.getByRole("combobox", { name: /accessory type/i }),
    "2",
  );

  expect(currentComponents()).toMatchObject([{ accessory: { type: 2 } }]);
});

test("removing a component takes it out of the message", async () => {
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [
      { type: 10, content: "First" },
      { type: 10, content: "Second" },
    ],
  });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  const first = screen.getAllByRole("button", { name: "Remove" })[0];
  await editorUser().click(first);

  expect(currentComponents()).toMatchObject([{ content: "Second" }]);
});

test("moving a component down reorders the message", async () => {
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [
      { type: 10, content: "First" },
      { type: 10, content: "Second" },
    ],
  });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  const moveDown = screen.getAllByRole("button", { name: "Move down" })[0];
  await editorUser().click(moveDown);

  expect(currentComponents()).toMatchObject([
    { content: "Second" },
    { content: "First" },
  ]);
});

test("the list counter follows the slot limit", () => {
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  expect(screen.getByText("0 / 5")).toBeInTheDocument();
});
