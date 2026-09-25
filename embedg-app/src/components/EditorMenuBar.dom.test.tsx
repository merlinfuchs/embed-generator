import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { loadMessage, renderEditor } from "../test/editor";
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
