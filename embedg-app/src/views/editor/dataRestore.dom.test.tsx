import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import { currentMessage, editorUser, loadMessage } from "../../test/editor";
import DataRestoreView from "./dataRestore";

function encode(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function renderAt(search: string) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[`/editor${search}`]}>
        <DataRestoreView />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

test("a data link replaces the draft only after restoring", async () => {
  loadMessage({ content: "Old message" });
  const data = encode({
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

test("an invalid data link leaves the draft alone", () => {
  loadMessage({ content: "Old message" });
  renderAt("?data=nope");

  expect(screen.queryByRole("button", { name: "Restore" })).toBeNull();
  expect(currentMessage().content).toBe("Old message");
});

test("the editor without a data link shows nothing", () => {
  renderAt("");

  expect(screen.queryByRole("button", { name: "Restore" })).toBeNull();
});
