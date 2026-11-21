import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ChannelSelect } from "./ChannelSelect";

const channel = (
  id: string,
  name: string,
  type: number,
  parent_id: string | null = null,
) => ({
  id,
  name,
  type,
  position: 0,
  parent_id,
  user_access: true,
  user_permissions: "0",
  bot_access: true,
  bot_permissions: "0",
  bot_can_send: true,
  bot_can_embed: true,
});

// A category with a text channel that has a thread and a forum with two posts, plus a text channel
// and a forum outside any category.
const channels = [
  channel("cat", "Info", 4),
  channel("general", "general", 0, "cat"),
  channel("help", "help-thread", 11, "general"),
  channel("support", "support", 15, "cat"),
  channel("bug", "bug-report", 11, "support"),
  channel("question", "question", 11, "support"),
  channel("lobby", "lobby", 0),
  channel("ideas", "ideas", 15),
  channel("idea", "idea-1", 11, "ideas"),
  // Its channel isn't visible, so it has nothing to collapse into.
  channel("orphan", "orphan-thread", 11, "hidden"),
];

function setup({
  channelId = null,
  sender,
}: {
  channelId?: string | null;
  sender?: "bot" | "webhook";
} = {}) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(["guild", "1", "channels"], {
    success: true,
    data: channels,
  });
  queryClient.setQueryData(["guilds"], { success: true, data: [] });

  const onChange = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ChannelSelect
        guildId="1"
        channelId={channelId}
        onChange={onChange}
        sender={sender}
      />
    </QueryClientProvider>,
  );
  const trigger = channelId
    ? screen.getByText(channels.find((c) => c.id === channelId)!.name)
    : screen.getByText("Select channel");
  fireEvent.click(trigger);
  return { onChange };
}

// A row of the list, not the selected channel shown on the closed select.
const listed = (name: string) =>
  screen
    .queryAllByText(name)
    .map((e) => e.closest("button"))
    .find((b) => b?.hasAttribute("aria-disabled")) ?? null;
const row = (name: string) => {
  const found = listed(name);
  if (!found) throw new Error(`${name} isn't listed`);
  return found;
};

test("threads and posts are collapsed, with their count on the parent", () => {
  setup();

  expect(listed("help-thread")).toBeNull();
  expect(listed("bug-report")).toBeNull();
  expect(listed("idea-1")).toBeNull();

  expect(row("general")).toHaveTextContent("1");
  expect(row("support")).toHaveTextContent("2");
  expect(screen.getAllByRole("button", { name: "Show threads" })).toHaveLength(
    1,
  );
  expect(screen.getAllByRole("button", { name: "Show posts" })).toHaveLength(2);
});

test("channels in a category aren't collapsed into it, nor threads of an unlisted channel", () => {
  setup();

  expect(listed("orphan-thread")).not.toBeNull();

  expect(listed("general")).not.toBeNull();
  expect(listed("support")).not.toBeNull();
  expect(row("Info")).not.toHaveTextContent(/\d/);
});

test("the toggle shows and hides only that channel's threads", () => {
  setup();

  const toggle = row("support").querySelector('[aria-label="Show posts"]')!;
  fireEvent.click(toggle);
  expect(listed("bug-report")).not.toBeNull();
  expect(listed("question")).not.toBeNull();
  expect(listed("idea-1")).toBeNull();
  expect(listed("help-thread")).toBeNull();

  fireEvent.click(row("support").querySelector('[aria-label="Hide posts"]')!);
  expect(listed("bug-report")).toBeNull();
});

test("clicking a text channel picks it instead of expanding it", () => {
  const { onChange } = setup();

  fireEvent.click(row("general"));
  expect(onChange).toHaveBeenCalledWith("general");
});

test("for the bot, clicking a forum expands it, since it can't be picked", () => {
  const { onChange } = setup({ sender: "bot" });

  fireEvent.click(row("support"));
  expect(onChange).not.toHaveBeenCalled();
  expect(listed("bug-report")).not.toBeNull();
});

test("search finds collapsed threads and posts", () => {
  setup();

  fireEvent.change(screen.getByRole("textbox"), { target: { value: "help" } });
  expect(listed("help-thread")).not.toBeNull();

  fireEvent.change(screen.getByRole("textbox"), { target: { value: "bug" } });
  expect(listed("bug-report")).not.toBeNull();
});

test("the parent of the selected thread opens with the list", () => {
  setup({ channelId: "help" });

  expect(listed("help-thread")).not.toBeNull();
  expect(listed("bug-report")).toBeNull();
});

test("the forum of the selected post opens with the list", () => {
  setup({ channelId: "bug" });

  expect(listed("bug-report")).not.toBeNull();
  expect(listed("question")).not.toBeNull();
  expect(listed("help-thread")).toBeNull();
});

const active = () => document.querySelector("button[data-active]");
const press = (key: string) =>
  fireEvent.keyDown(screen.getByRole("textbox"), { key });

test("Arrow Right and Left show and hide a channel's threads", () => {
  setup();

  expect(active()).toBe(row("general"));
  press("ArrowRight");
  expect(listed("help-thread")).not.toBeNull();
  expect(active()).toBe(row("general"));

  press("ArrowLeft");
  expect(listed("help-thread")).toBeNull();
});

test("for the bot, Enter on a forum shows its posts", () => {
  const { onChange } = setup({ sender: "bot" });

  press("ArrowDown");
  expect(active()).toBe(row("support"));
  press("Enter");
  expect(onChange).not.toHaveBeenCalled();
  expect(listed("bug-report")).not.toBeNull();
  expect(active()).toBe(row("support"));

  press("ArrowDown");
  press("Enter");
  expect(onChange).toHaveBeenCalledWith("bug");
});

test("for the bot, the highlight skips forums while searching", () => {
  setup({ sender: "bot" });

  fireEvent.change(screen.getByRole("textbox"), { target: { value: "u" } });
  // support can't be picked and its posts are listed already.
  expect(active()).toBe(row("bug-report"));
});
