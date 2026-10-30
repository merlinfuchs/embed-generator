import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { useToasts } from "../../util/toasts";
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

test("an invalid data link says so and leaves the draft alone", () => {
  loadMessage({ content: "Old message" });
  useToasts.setState({ toasts: [] });
  renderAt("?data=nope");

  expect(screen.queryByRole("button", { name: "Restore" })).toBeNull();
  expect(useToasts.getState().toasts).toMatchObject([
    { title: "Failed to open message link" },
  ]);
  expect(currentMessage().content).toBe("Old message");
});

test("a link with actions warns about them", () => {
  renderAt(
    `?data=${encodeDataLink({
      components: [
        {
          type: 1,
          components: [{ type: 2, style: 1, label: "Hi", action_set_id: "a" }],
        },
      ],
      actions: { a: { actions: [{ type: 2, target_id: "123" }] } },
    })}`,
  );

  expect(screen.getByText(/have actions, like giving out roles/)).toBeTruthy();
});
