import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  COMPONENTS_V2_FLAG,
  SUPPRESS_NOTIFICATIONS_FLAG,
} from "../state/document";
import {
  currentMessage,
  editorUser,
  loadMessage,
  renderEditor,
} from "../test/editor";
import EditorComponentsV2Toggle from "./EditorComponentsV2Toggle";
import EditorSilentSetting from "./EditorSilentSetting";

const isSilent = () =>
  ((currentMessage().flags ?? 0) & SUPPRESS_NOTIFICATIONS_FLAG) !== 0;

test("toggling it sets and clears the suppress notifications flag", async () => {
  loadMessage({ content: "Hello", embeds: [], components: [] });
  renderEditor(<EditorSilentSetting />);

  const toggle = screen.getByRole("checkbox", { name: "Silent message" });
  expect(toggle).toHaveAttribute("aria-checked", "false");

  await editorUser().click(toggle);
  expect(isSilent()).toBe(true);
  expect(toggle).toHaveAttribute("aria-checked", "true");

  await editorUser().click(toggle);
  expect(isSilent()).toBe(false);
});

test("it keeps the Components V2 flag", async () => {
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [{ type: 10, content: "Some text" }],
  });
  renderEditor(<EditorSilentSetting />);

  await editorUser().click(
    screen.getByRole("checkbox", { name: "Silent message" }),
  );
  expect(currentMessage().flags).toBe(
    COMPONENTS_V2_FLAG | SUPPRESS_NOTIFICATIONS_FLAG,
  );
});

test("switching between embeds and Components V2 stays silent", async () => {
  loadMessage({
    content: "Hello",
    flags: SUPPRESS_NOTIFICATIONS_FLAG,
    embeds: [],
    components: [],
  });
  renderEditor(<EditorComponentsV2Toggle />);

  await editorUser().click(screen.getByRole("button", { name: /Embeds V1/ }));
  await editorUser().click(screen.getByRole("button", { name: "Confirm" }));

  expect(currentMessage().flags).toBe(
    COMPONENTS_V2_FLAG | SUPPRESS_NOTIFICATIONS_FLAG,
  );
});
