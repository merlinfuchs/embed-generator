import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { SavedMessageWire } from "../api/wire";
import { editorUser } from "../test/editor";
import { useToasts } from "../util/toasts";
import SavedMessage from "./SavedMessage";

const message: SavedMessageWire = {
  id: "msg-1",
  owner_id: "user-1",
  guild_id: null,
  updated_at: "2024-01-01T00:00:00Z",
  name: "Welcome",
  description: null,
  data: { content: "Hello" },
};

const fetchMock = vi.fn();
let queryClient: QueryClient;

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  useToasts.setState({ toasts: [] });

  queryClient = new QueryClient();
  queryClient.setQueryData(["saved-messages", null], {
    success: true,
    data: [message],
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function respond(body: unknown) {
  fetchMock.mockResolvedValue({ json: async () => body });
}

function renderMessage() {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SavedMessage message={message} guildId={null} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function rename(name: string) {
  const user = editorUser();
  await user.click(screen.getByRole("button", { name: /Rename Message/ }));
  const input = screen.getByRole("textbox", { name: "Message Name" });
  await user.clear(input);
  await user.type(input, `${name}{Enter}`);
}

test("renaming keeps the message data and refreshes the list", async () => {
  respond({ success: true, data: { ...message, name: "Goodbye" } });
  renderMessage();

  await rename("Goodbye");

  await waitFor(() =>
    expect(
      queryClient.getQueryState(["saved-messages", null])?.isInvalidated,
    ).toBe(true),
  );
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("/api/saved-messages/msg-1");
  expect(init.method).toBe("PUT");
  // No data, so the server keeps what is saved, even if it is newer.
  expect(JSON.parse(init.body)).toEqual({
    name: "Goodbye",
    description: null,
  });
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});

test("a failed rename shows an error and keeps the input open", async () => {
  respond({ success: false, error: { code: "x", message: "Nope" } });
  renderMessage();

  await rename("Goodbye");

  await waitFor(() =>
    expect(useToasts.getState().toasts).toMatchObject([
      { title: "Failed to rename message", message: "Nope", type: "error" },
    ]),
  );
  expect(screen.getByRole("textbox", { name: "Message Name" })).toHaveValue(
    "Goodbye",
  );
});

test("escape leaves the name as it was", async () => {
  renderMessage();
  const user = editorUser();

  await user.click(screen.getByRole("button", { name: /Rename Message/ }));
  await user.type(
    screen.getByRole("textbox", { name: "Message Name" }),
    "x{Escape}",
  );

  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.getByText("Welcome")).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});
