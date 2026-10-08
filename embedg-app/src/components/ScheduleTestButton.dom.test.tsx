import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { renderEditor } from "../test/editor";
import ScheduleTestButton from "./ScheduleTestButton";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("sends the saved message to the channel once", async () => {
  const fetch = vi.fn(async () => ({
    json: async () => ({ success: true, data: {} }),
  }));
  vi.stubGlobal("fetch", fetch);
  renderEditor(
    <ScheduleTestButton
      guildId="1"
      channelId="2"
      threadName={null}
      savedMessageId="saved"
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /Send test/ }));
  // Nothing goes out before it's confirmed.
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

  await waitFor(() => expect(fetch).toHaveBeenCalled());
  const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe("/api/scheduled-messages/test?guild_id=1");
  expect(JSON.parse(init.body as string)).toEqual({
    channel_id: "2",
    thread_name: null,
    saved_message_id: "saved",
  });
});

test("doesn't send without a channel", () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  renderEditor(
    <ScheduleTestButton
      guildId="1"
      channelId={null}
      threadName={null}
      savedMessageId="saved"
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /Send test/ }));

  expect(fetch).not.toHaveBeenCalled();
});
