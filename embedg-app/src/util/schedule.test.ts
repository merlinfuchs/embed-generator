import { describe, expect, it } from "vitest";
import {
  defaultRepeat,
  describeRepeat,
  describeSchedule,
  parseRepeat,
  type Repeat,
  repeatToCron,
  scheduleFromDraft,
  newScheduleDraft,
} from "./schedule";

describe("parseRepeat", () => {
  it("reads what the editor writes", () => {
    const repeats: Repeat[] = [
      { ...defaultRepeat, unit: "minutes", every: 15 },
      { ...defaultRepeat, unit: "hours", every: 5, minute: 30 },
      { ...defaultRepeat, unit: "days", every: 28, hour: 5, minute: 50 },
      { ...defaultRepeat, unit: "weeks", every: 2, weekdays: [1, 4] },
      { ...defaultRepeat, unit: "months", every: 3, monthDay: 31 },
    ];
    for (const r of repeats) {
      expect(parseRepeat(repeatToCron(r), r.every)).toEqual(r);
    }
  });

  it("reads what the old cron builder saved", () => {
    expect(parseRepeat("30 12 1/1 * ?", 1)).toMatchObject({
      unit: "days",
      hour: 12,
      minute: 30,
    });
    expect(parseRepeat("0 0/1 1/1 * ?", 1)).toMatchObject({
      unit: "hours",
      minute: 0,
    });
    expect(parseRepeat("00 08 ? * MON-FRI", 1)).toMatchObject({
      unit: "weeks",
      hour: 8,
      weekdays: [1, 2, 3, 4, 5],
    });
    expect(parseRepeat("0 12 ? * SUN,SAT", 1)).toMatchObject({
      weekdays: [0, 6],
    });
    expect(parseRepeat("0 12 15 1/1 ?", 1)).toMatchObject({
      unit: "months",
      monthDay: 15,
    });
  });

  it("leaves everything else to the cron expression", () => {
    for (const cron of [
      "30 12 1/14 * ?", // every 14 days that restarts each month
      "0/15 * * * ?",
      "0 0/5 * * *",
      "0 12 L * ?",
      "0 12 1 1/3 ?",
      "0 12 1,15 * *",
      "0 12 * * 1#1",
      "0 12 * 6 *",
      "@daily",
    ]) {
      expect(parseRepeat(cron, 1), cron).toBeNull();
    }
  });
});

describe("describe", () => {
  it("says the sentence the editor shows", () => {
    expect(
      describeRepeat({ ...defaultRepeat, unit: "days", every: 28 }),
    ).toMatch(/^Every 28 days at /);
    expect(
      describeRepeat({ ...defaultRepeat, unit: "weeks", weekdays: [4, 1] }),
    ).toMatch(/^Every week on Mon, Thu at /);
    expect(
      describeRepeat({ ...defaultRepeat, unit: "minutes", every: 1 }),
    ).toBe("Every minute");
  });

  it("falls back to cronstrue", () => {
    expect(describeSchedule("30 12 1/14 * ?", 1)).toContain("every 14 days");
  });
});

describe("scheduleFromDraft", () => {
  it("sends the cron of the sentence with its interval", () => {
    const draft = {
      ...newScheduleDraft("America/Denver"),
      onlyOnce: false,
      startAt: "2026-10-31T06:00:00.000Z",
      repeat: {
        ...defaultRepeat,
        unit: "days" as const,
        every: 28,
        hour: 5,
        minute: 50,
      },
    };
    expect(scheduleFromDraft(draft)).toEqual({
      only_once: false,
      cron_expression: "50 5 * * *",
      cron_timezone: "America/Denver",
      cron_interval: 28,
      start_at: "2026-10-31T06:00:00.000Z",
      end_at: null,
      end_after_runs: 0,
    });
  });

  it("leaves ending after a number of sends to the server", () => {
    const draft = {
      ...newScheduleDraft("UTC"),
      onlyOnce: false,
      startAt: "2026-10-31T00:00:00.000Z",
      ends: "count" as const,
      endCount: 3,
    };
    expect(scheduleFromDraft(draft)).toMatchObject({
      end_at: null,
      end_after_runs: 3,
    });
  });
});
