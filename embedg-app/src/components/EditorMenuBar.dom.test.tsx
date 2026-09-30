import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { messageDocumentStore } from "../state/document";
import {
  currentMessage,
  editorUser,
  loadMessage,
  renderEditor,
} from "../test/editor";
import EditorMenuBar from "./EditorMenuBar";

test("the settings button marks settings that differ from Discord's defaults", () => {
  loadMessage({
    content: "",
    allowed_mentions: {
      parse: ["users"],
      users: [],
      roles: [],
      replied_user: false,
    },
  });
  renderEditor(<EditorMenuBar />);

  expect(
    screen.getByRole("link", { name: "Message Settings (changed)" }),
  ).toHaveAttribute("href", "/editor/settings");
});

test("it stays plain with the defaults", () => {
  loadMessage({ content: "" });
  renderEditor(<EditorMenuBar />);

  expect(
    screen.getByRole("link", { name: "Message Settings" }),
  ).toBeInTheDocument();
});

test("an imported setting that matches the defaults isn't marked", () => {
  loadMessage({
    content: "",
    allowed_mentions: {
      parse: ["users", "roles", "everyone"],
      users: [],
      roles: [],
      replied_user: false,
    },
  });
  renderEditor(<EditorMenuBar />);

  expect(
    screen.getByRole("link", { name: "Message Settings" }),
  ).toBeInTheDocument();
});

test("shift-clicking the broom clears the message without the templates", async () => {
  loadMessage({ content: "Hello", embeds: [{ title: "Old embed" }] });
  renderEditor(<EditorMenuBar />);
  const user = editorUser();

  await user.keyboard("{Shift>}");
  await user.click(screen.getByRole("button", { name: /Clear Message/ }));
  await user.keyboard("{/Shift}");

  expect(currentMessage()).toMatchObject({ content: "", embeds: [] });

  // It skips the confirmation, but can be undone.
  messageDocumentStore.temporal.getState().undo();
  expect(currentMessage().content).toBe("Hello");
});

test("a plain click on the broom leaves the message for the dialog", async () => {
  loadMessage({ content: "Hello" });
  renderEditor(<EditorMenuBar />);

  await editorUser().click(
    screen.getByRole("button", { name: /Clear Message/ }),
  );

  expect(currentMessage().content).toBe("Hello");
});
