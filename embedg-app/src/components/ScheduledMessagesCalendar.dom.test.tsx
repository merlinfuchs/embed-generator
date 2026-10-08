import { fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { ScheduledMessageWire } from "../api/wire";
import { renderEditor } from "../test/editor";
import { getCurrentTimezone, zonedDate } from "../util/time";
import ScheduledMessagesCalendar from "./ScheduledMessagesCalendar";

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

  const day = zonedDate(tomorrowNoon().toISOString(), getCurrentTimezone());
  // The six weeks shown always reach past the end of the month, so tomorrow is in them.
  fireEvent.click(
    screen.getByRole("button", { name: `Schedule a message on ${day}` }),
  );
  expect(onCreate).toHaveBeenCalledWith(day, getCurrentTimezone());
});

test("shows the sends in the picked timezone", async () => {
  // Tomorrow at 23:30 UTC, the afternoon after at UTC+14.
  const d = new Date();
  const at = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 23, 30),
  );
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
  renderEditor(
    <ScheduledMessagesCalendar
      guildId="1"
      messages={[message("a", "Raid")]}
      onOpen={() => {}}
    />,
  );

  const pick = (tz: string) => {
    fireEvent.click(screen.getByRole("button", { name: getCurrentTimezone() }));
    fireEvent.click(screen.getByRole("button", { name: tz }));
  };

  // UTC+14, no machine running the tests is in it.
  pick("Pacific/Kiritimati");
  expect(
    (await screen.findAllByRole("button", { name: /Raid/ }))[0],
  ).toHaveAttribute("title", expect.stringMatching(/^Raid at (1:30|13:30)/));
});
