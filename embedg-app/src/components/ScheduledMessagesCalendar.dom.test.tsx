import { fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { ScheduledMessageWire } from "../api/wire";
import { renderEditor } from "../test/editor";
import ScheduledMessagesCalendar, {
  localDay,
} from "./ScheduledMessagesCalendar";

afterEach(() => {
  vi.unstubAllGlobals();
});

function message(id: string, name: string): ScheduledMessageWire {
  return { id, name, run_times: null } as ScheduledMessageWire;
}

// Noon tomorrow, local time, so it is in the month shown or the days around it.
function tomorrowNoon(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12, 0);
}

test("shows the runs and opens their message", async () => {
  const at = tomorrowNoon();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      json: async () => ({
        success: true,
        data: {
          runs: [{ scheduled_message_id: "a", at: at.toISOString() }],
          truncated: false,
        },
      }),
    })),
  );
  const onOpen = vi.fn();
  renderEditor(
    <ScheduledMessagesCalendar
      guildId="1"
      messages={[message("a", "Weekly recap")]}
      onOpen={onOpen}
      onCreate={() => {}}
    />,
  );

  // Once in the month grid, once in the agenda list for small screens.
  const chips = await screen.findAllByRole("button", { name: /Weekly recap/ });
  fireEvent.click(chips[0]);

  expect(onOpen).toHaveBeenCalledWith("a");
});

test("schedules a new message on a day", () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      json: async () => ({
        success: true,
        data: { runs: [], truncated: false },
      }),
    })),
  );
  const onCreate = vi.fn();
  renderEditor(
    <ScheduledMessagesCalendar
      guildId="1"
      messages={[]}
      onOpen={() => {}}
      onCreate={onCreate}
    />,
  );

  const day = localDay(tomorrowNoon());
  // The six weeks shown always reach past the end of the month, so tomorrow is in them.
  fireEvent.click(
    screen.getByRole("button", { name: `Schedule a message on ${day}` }),
  );
  expect(onCreate).toHaveBeenCalledWith(day);
});
