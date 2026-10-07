import { fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, test } from "vitest";
import { renderEditor } from "../test/editor";
import DatesFields from "./ScheduleDates";

let latest: string[] = [];

function Harness({ periodicAllowed = true }: { periodicAllowed?: boolean }) {
  const [dates, setDates] = useState<string[]>([]);
  latest = dates;
  return (
    <DatesFields
      dates={dates}
      timezone="UTC"
      onChange={setDates}
      periodicAllowed={periodicAllowed}
    />
  );
}

// Days of next month, which are never in the past.
function nextMonthDay(day: number): string {
  const now = new Date();
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, day),
  );
  return d.toISOString().slice(0, 10);
}

test("picking days adds dates at the time of the last one", () => {
  renderEditor(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Next month" }));

  fireEvent.click(screen.getByRole("button", { name: nextMonthDay(10) }));
  expect(latest).toEqual([`${nextMonthDay(10)}T12:00:00.000Z`]);

  fireEvent.change(screen.getByLabelText(/^Time on /), {
    target: { value: "18:30" },
  });
  fireEvent.click(screen.getByRole("button", { name: nextMonthDay(17) }));

  expect(latest).toEqual([
    `${nextMonthDay(10)}T18:30:00.000Z`,
    `${nextMonthDay(17)}T18:30:00.000Z`,
  ]);
});

test("picking a picked day removes it", () => {
  renderEditor(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Next month" }));

  const day = screen.getByRole("button", { name: nextMonthDay(10) });
  fireEvent.click(day);
  fireEvent.click(day);

  expect(latest).toEqual([]);
});

test("without premium another day moves the one date", () => {
  renderEditor(<Harness periodicAllowed={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Next month" }));

  fireEvent.click(screen.getByRole("button", { name: nextMonthDay(10) }));
  fireEvent.click(screen.getByRole("button", { name: nextMonthDay(17) }));

  expect(latest).toEqual([`${nextMonthDay(17)}T12:00:00.000Z`]);
});
