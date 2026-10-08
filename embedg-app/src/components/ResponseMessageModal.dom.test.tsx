import { screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { messageDocumentStore } from "../state/document";
import { editorUser, loadMessage, renderEditor } from "../test/editor";
import EditorActionSet from "./EditorActionSet";

const features = vi.hoisted(() => ({
  max_actions_per_component: 5,
  advanced_action_types: true,
}));

vi.mock("../util/premium", () => ({
  usePremiumGuildFeatures: () => features,
  usePremiumUserFeatures: () => ({}),
  useConsumableEntitlement: () => ({}),
}));

const SET_ID = "set-1";

function action() {
  return messageDocumentStore.getState().actions[SET_ID]?.actions[0];
}

beforeEach(() => {
  features.advanced_action_types = true;
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
    actions: { [SET_ID]: { actions: [{ type: 1, id: 1, text: "hi" }] } },
  });
});

test("a message response is built in its own editor", async () => {
  renderEditor(<EditorActionSet setId={SET_ID} />);
  const user = editorUser();

  await user.selectOptions(
    screen.getByRole("combobox", { name: "Type" }),
    "message_response",
  );
  expect(action()).toMatchObject({ type: 5, message: { content: "" } });
  expect(action()).not.toHaveProperty("target_id");

  await user.click(screen.getByRole("button", { name: "Edit Message" }));
  await user.type(await screen.findByLabelText("Content"), "Thanks!");

  await waitFor(() =>
    expect(action()).toMatchObject({ message: { content: "Thanks!" } }),
  );
  // The message being edited is the response, not the one with the button.
  expect(
    messageDocumentStore.getState().nodes[
      messageDocumentStore.getState().rootId
    ],
  ).toMatchObject({ content: "" });
});

test("changing where the response goes keeps its message", async () => {
  renderEditor(<EditorActionSet setId={SET_ID} />);
  const user = editorUser();

  await user.selectOptions(
    screen.getByRole("combobox", { name: "Type" }),
    "message_response",
  );
  await user.click(screen.getByRole("button", { name: "Edit Message" }));
  await user.type(await screen.findByLabelText("Content"), "Thanks!");
  await user.click(screen.getByRole("button", { name: "Done" }));

  await user.selectOptions(
    screen.getByRole("combobox", { name: "Target" }),
    "dm",
  );

  expect(action()).toMatchObject({ type: 7, message: { content: "Thanks!" } });
});

test("without premium the message response offers an upgrade", async () => {
  features.advanced_action_types = false;
  renderEditor(<EditorActionSet setId={SET_ID} />);

  await editorUser().selectOptions(
    screen.getByRole("combobox", { name: "Type" }),
    "message_response",
  );

  expect(
    screen.queryByRole("button", { name: "Edit Message" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(/Get Premium for/)).toBeInTheDocument();
});
