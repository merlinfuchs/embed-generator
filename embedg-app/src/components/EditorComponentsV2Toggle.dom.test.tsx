import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { COMPONENTS_V2_FLAG } from "../state/document";
import {
  currentMessage,
  editorUser,
  loadMessage,
  renderEditor,
} from "../test/editor";
import EditorComponentsV2Toggle from "./EditorComponentsV2Toggle";

const v1Message = {
  content: "Some content",
  embeds: [{ title: "An embed", fields: [] }],
  components: [],
};

const v2Message = {
  content: "",
  flags: COMPONENTS_V2_FLAG,
  components: [{ type: 10, content: "Some text" }],
};

function isV2() {
  return ((currentMessage().flags ?? 0) & COMPONENTS_V2_FLAG) !== 0;
}

test("turning it on asks before replacing the message", async () => {
  loadMessage(v1Message);
  renderEditor(<EditorComponentsV2Toggle />);

  await editorUser().click(screen.getByRole("button", { name: /Embeds V1/ }));

  expect(
    screen.getByText(/enable Components V2/i, { exact: false }),
  ).toBeInTheDocument();
  // Nothing changes until the modal is confirmed.
  expect(isV2()).toBe(false);
  expect(currentMessage().embeds).toHaveLength(1);
});

test("cancelling leaves the message alone", async () => {
  loadMessage(v1Message);
  renderEditor(<EditorComponentsV2Toggle />);

  await editorUser().click(screen.getByRole("button", { name: /Embeds V1/ }));
  await editorUser().click(screen.getByRole("button", { name: "Cancel" }));

  expect(isV2()).toBe(false);
  expect(currentMessage().embeds).toHaveLength(1);
});

test("confirming switches to an empty v2 message", async () => {
  loadMessage(v1Message);
  renderEditor(<EditorComponentsV2Toggle />);

  await editorUser().click(screen.getByRole("button", { name: /Embeds V1/ }));
  await editorUser().click(screen.getByRole("button", { name: "Confirm" }));

  const message = currentMessage();
  expect(isV2()).toBe(true);
  expect(message.content).toBe("");
  expect(message.embeds).toEqual([]);
  expect(message.components).toEqual([]);
});

test("turning it off restores the default message", async () => {
  loadMessage(v2Message);
  renderEditor(<EditorComponentsV2Toggle />);

  await editorUser().click(screen.getByRole("button", { name: /Embeds V1/ }));
  await editorUser().click(screen.getByRole("button", { name: "Confirm" }));

  const message = currentMessage();
  expect(isV2()).toBe(false);
  expect(message.components).toEqual([]);
  expect(message.content).not.toBe("");
});
