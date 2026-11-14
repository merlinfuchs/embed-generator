import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ChannelSelect } from "./ChannelSelect";

const channel = (id: string, name: string, canSend = true) => ({
  id,
  name,
  type: 0,
  position: 0,
  parent_id: null,
  user_access: canSend,
  user_permissions: "0",
  bot_access: canSend,
  bot_permissions: "0",
  bot_can_send: canSend,
  bot_can_embed: true,
});

function setup() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(["guild", "1", "channels"], {
    success: true,
    data: [
      channel("a", "announcements", false),
      channel("g", "general"),
      channel("r", "random"),
    ],
  });
  queryClient.setQueryData(["guilds"], { success: true, data: [] });

  const onChange = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ChannelSelect guildId="1" channelId={null} onChange={onChange} />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByText("Select channel"));
  return { onChange };
}

const row = (name: string) => screen.getByText(name).closest("button")!;

test("highlights the first channel that can be picked", () => {
  setup();

  expect(row("announcements")).not.toHaveAttribute("data-active");
  expect(row("general")).toHaveAttribute("data-active");
});

test("arrow keys move the highlight and Enter picks it", () => {
  const { onChange } = setup();

  fireEvent.keyDown(row("general"), { key: "ArrowDown" });
  expect(row("random")).toHaveAttribute("data-active");

  // Wraps around, skipping the channel that can't be picked.
  fireEvent.keyDown(row("random"), { key: "ArrowDown" });
  expect(row("general")).toHaveAttribute("data-active");

  fireEvent.keyDown(row("general"), { key: "ArrowUp" });
  fireEvent.keyDown(row("random"), { key: "Enter" });
  expect(onChange).toHaveBeenCalledWith("r");
});

test("Enter picks the first match of a search", () => {
  const { onChange } = setup();

  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "ran" } });
  fireEvent.keyDown(input, { key: "Enter" });

  expect(onChange).toHaveBeenCalledWith("r");
});

test("Escape closes the list", () => {
  setup();

  fireEvent.keyDown(row("general"), { key: "Escape" });

  expect(screen.queryByText("general")).not.toBeInTheDocument();
});
