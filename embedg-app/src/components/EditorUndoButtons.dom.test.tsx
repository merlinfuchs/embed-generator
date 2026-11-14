import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { COMPONENTS_V2_FLAG } from "../state/document";
import {
  currentComponents,
  editorUser,
  loadMessage,
  renderEditor,
} from "../test/editor";
import EditorComponents from "./EditorComponents";
import EditorUndoButtons from "./EditorUndoButtons";

vi.mock("../util/premium", () => ({
  usePremiumGuildFeatures: () => ({
    max_actions_per_component: 5,
  }),
  usePremiumUserFeatures: () => ({}),
}));

function editor() {
  return (
    <>
      <EditorUndoButtons />
      <EditorComponents defaultCollapsed={false} />
    </>
  );
}

/**
 * The history debounces by a second, so without control of time the first edit
 * of a test lands inside the previous test's window and goes untracked.
 */
const user = () => editorUser({ advanceTimers: vi.advanceTimersByTime });

beforeEach(() => {
  vi.useFakeTimers();
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [{ type: 10, content: "First" }],
  });
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

test("undo is offered only once there is something to undo", async () => {
  renderEditor(editor());

  expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();

  await user().click(screen.getByRole("button", { name: /Add Component/ }));
  await user().click(screen.getByRole("button", { name: "Text Display" }));

  expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
});

test("undo takes back a component that was added", async () => {
  renderEditor(editor());

  await user().click(screen.getByRole("button", { name: /Add Component/ }));
  await user().click(screen.getByRole("button", { name: "Text Display" }));
  expect(currentComponents()).toHaveLength(2);

  await user().click(screen.getByRole("button", { name: "Undo" }));

  expect(currentComponents()).toHaveLength(1);
});

test("redo puts it back", async () => {
  renderEditor(editor());

  await user().click(screen.getByRole("button", { name: /Add Component/ }));
  await user().click(screen.getByRole("button", { name: "Text Display" }));
  await user().click(screen.getByRole("button", { name: "Undo" }));
  await user().click(screen.getByRole("button", { name: "Redo" }));

  expect(currentComponents()).toHaveLength(2);
});

test("undo covers a removal as well as an addition", async () => {
  renderEditor(editor());

  await user().click(screen.getByRole("button", { name: "Remove" }));
  expect(currentComponents()).toHaveLength(0);

  await user().click(screen.getByRole("button", { name: "Undo" }));

  expect(currentComponents()).toMatchObject([{ content: "First" }]);
});

test("redo is offered only after an undo", async () => {
  renderEditor(editor());

  await user().click(screen.getByRole("button", { name: "Remove" }));
  expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();

  await user().click(screen.getByRole("button", { name: "Undo" }));

  expect(screen.getByRole("button", { name: "Redo" })).toBeEnabled();
});

async function addComponent() {
  await user().click(screen.getByRole("button", { name: /Add Component/ }));
  await user().click(screen.getByRole("button", { name: "Text Display" }));
}

test.each([
  ["Ctrl", { ctrlKey: true }],
  ["Cmd", { metaKey: true }],
])("%s+Z undoes and %s+Shift+Z redoes", async (_, modifier) => {
  renderEditor(editor());
  await addComponent();
  expect(currentComponents()).toHaveLength(2);

  fireEvent.keyDown(document, { key: "z", ...modifier });
  expect(currentComponents()).toHaveLength(1);

  fireEvent.keyDown(document, { key: "Z", shiftKey: true, ...modifier });
  expect(currentComponents()).toHaveLength(2);
});

test("Ctrl+Y redoes but Cmd+Y is left to the browser", async () => {
  renderEditor(editor());
  await addComponent();
  fireEvent.keyDown(document, { key: "z", ctrlKey: true });
  expect(currentComponents()).toHaveLength(1);

  fireEvent.keyDown(document, { key: "y", metaKey: true });
  expect(currentComponents()).toHaveLength(1);

  fireEvent.keyDown(document, { key: "y", ctrlKey: true });
  expect(currentComponents()).toHaveLength(2);
});
