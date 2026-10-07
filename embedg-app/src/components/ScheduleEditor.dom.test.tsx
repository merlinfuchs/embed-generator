import { fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, test } from "vitest";
import { renderEditor } from "../test/editor";
import {
  newScheduleDraft,
  type ScheduleDraft,
  scheduleFromDraft,
} from "../util/schedule";
import ScheduleEditor, { type SchedulePreview } from "./ScheduleEditor";

const noPreview: SchedulePreview = {
  runs: [],
  more: false,
  error: null,
  checking: false,
};

let latest: ScheduleDraft;

function Harness({ preview = noPreview }: { preview?: SchedulePreview }) {
  const [draft, setDraft] = useState<ScheduleDraft>({
    ...newScheduleDraft("UTC"),
    onlyOnce: false,
    startAt: "2026-10-07T00:00:00.000Z",
  });
  latest = draft;
  return (
    <ScheduleEditor
      draft={draft}
      onChange={setDraft}
      preview={preview}
      periodicAllowed
    />
  );
}

test("picking weeks and days builds a weekly cron with its interval", () => {
  renderEditor(<Harness />);

  fireEvent.change(screen.getByLabelText("Every"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Unit"), {
    target: { value: "weeks" },
  });
  // The week starts on Monday, which is picked by default.
  const days = screen.getAllByRole("button", {
    name: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/,
  });
  expect(days.map((b) => b.textContent)).toEqual([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Thu" }));

  expect(scheduleFromDraft(latest)).toMatchObject({
    cron_expression: "0 12 * * 1,4",
    cron_interval: 2,
  });
});

test("the advanced mode keeps the cron of the sentence", () => {
  renderEditor(<Harness />);

  fireEvent.click(
    screen.getByRole("button", { name: "Advanced: use a cron expression" }),
  );

  expect(screen.getByLabelText("Cron expression")).toHaveValue("0 12 * * *");
  expect(scheduleFromDraft(latest).cron_interval).toBe(1);
});

test("shows why a schedule never sends instead of its runs", () => {
  renderEditor(
    <Harness
      preview={{
        ...noPreview,
        error: "The schedule doesn't run before the end date.",
      }}
    />,
  );

  expect(
    screen.getByText("The schedule doesn't run before the end date."),
  ).toBeInTheDocument();
});

test("lists the upcoming sends and says when they stop", () => {
  renderEditor(
    <Harness
      preview={{
        ...noPreview,
        runs: ["2026-10-08T12:00:00Z", "2026-10-09T12:00:00Z"],
      }}
    />,
  );

  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("then it ends")).toBeInTheDocument();
});
