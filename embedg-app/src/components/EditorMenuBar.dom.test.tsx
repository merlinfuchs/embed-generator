import { screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { COMPONENTS_V2_FLAG, messageDocumentStore } from "../state/document";
import { useSendSettingsStore } from "../state/sendSettings";
import {
  currentMessage,
  editorUser,
  loadMessage,
  renderEditor,
} from "../test/editor";
import EditorMenuBar from "./EditorMenuBar";

afterEach(() => {
  useSendSettingsStore.setState({ mode: "webhook", webhookUrl: null });
});

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

test("Fluxer has no Components V2, so there is nothing to toggle", () => {
  useSendSettingsStore.setState({
    webhookUrl: "https://api.fluxer.app/webhooks/123/token",
  });
  loadMessage({ content: "" });
  renderEditor(<EditorMenuBar />);

  expect(screen.queryByText("Components V2")).toBeNull();
});

test("a Components V2 message can still be switched back for Fluxer", () => {
  useSendSettingsStore.setState({
    webhookUrl: "https://api.fluxer.app/webhooks/123/token",
  });
  loadMessage({ flags: COMPONENTS_V2_FLAG, components: [] });
  renderEditor(<EditorMenuBar />);

  expect(screen.getByText("Components V2")).toBeInTheDocument();
});
