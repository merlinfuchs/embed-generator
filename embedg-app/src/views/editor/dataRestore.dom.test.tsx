import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { encodeDataLink } from "../../test/dataLink";
import {
  currentMessage,
  editorUser,
  loadMessage,
  renderEditor,
} from "../../test/editor";
import DataRestoreView from "./dataRestore";

function renderAt(search: string) {
  return renderEditor(<DataRestoreView />, `/editor/open${search}`);
}

test("a data link replaces the draft only after restoring", async () => {
  loadMessage({ content: "Old message" });
  const data = encodeDataLink({
    messages: [{ data: { content: "From the link" } }, { data: {} }],
  });
  renderAt(`?data=${data}`);
  const user = editorUser();

  expect(screen.getByText("From the link")).toBeTruthy();
  expect(screen.getByText(/contains 2 messages/)).toBeTruthy();
  expect(currentMessage().content).toBe("Old message");

  await user.click(screen.getByRole("button", { name: "Restore" }));

  expect(currentMessage().content).toBe("From the link");
});

test("an invalid or missing data link leaves the draft alone", () => {
  loadMessage({ content: "Old message" });
  renderAt("?data=nope");
  renderAt("");

  expect(screen.queryByRole("button", { name: "Restore" })).toBeNull();
  expect(currentMessage().content).toBe("Old message");
});
