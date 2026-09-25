import { fireEvent, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { messageDocumentStore, selectAllowedMentions } from "../state/document";
import { loadMessage, renderEditor } from "../test/editor";
import EditorAllowedMentions from "./EditorAllowedMentions";

function allowedMentions() {
  return selectAllowedMentions(messageDocumentStore.getState());
}

function checkbox(name: string) {
  return screen.getByRole("checkbox", { name });
}

test("unchecking a mention type stops only it from pinging", () => {
  loadMessage({ content: "@everyone" });
  renderEditor(<EditorAllowedMentions />);

  fireEvent.click(checkbox("@everyone and @here"));

  expect(checkbox("@everyone and @here")).toHaveAttribute(
    "aria-checked",
    "false",
  );
  expect(allowedMentions()?.parse).toEqual(["users", "roles"]);
});
