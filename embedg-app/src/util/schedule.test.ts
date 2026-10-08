import { afterEach, describe, expect, it, vi } from "vitest";
import type { ScheduledMessageWire } from "../api/wire";
import {
  dateOnDay,
  defaultRepeat,
  describeRepeat,
  describeSchedule,
  messageState,
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
      "0 12 * * 1/1", // Monday to Saturday
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
      onDates: false,
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
      run_times: null,
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
      onDates: false,
      startAt: "2026-10-31T00:00:00.000Z",
      ends: "count" as const,
      endCount: 3,
    };
    expect(scheduleFromDraft(draft)).toMatchObject({
      end_at: null,
      end_after_runs: 3,
    });
  });

  it("sends dates sorted, starting at the first", () => {
    const draft = {
      ...newScheduleDraft("UTC"),
      dates: ["2026-10-23T18:00:00.000Z", "2026-10-16T18:00:00.000Z"],
    };
    expect(scheduleFromDraft(draft)).toMatchObject({
      run_times: ["2026-10-16T18:00:00.000Z", "2026-10-23T18:00:00.000Z"],
      cron_expression: null,
      start_at: "2026-10-16T18:00:00.000Z",
    });
  });
});

describe("dateOnDay", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("puts the date on the day at the time", () => {
    vi.useFakeTimers({ now: new Date("2026-10-07T09:00:00Z") });
    expect(dateOnDay("2026-10-10", "America/Denver")).toBe(
      "2026-10-10T18:00:00.000Z",
    );
  });

  it("moves a time that is over to the next five minutes", () => {
    vi.useFakeTimers({ now: new Date("2026-10-07T15:02:10Z") });
    expect(dateOnDay("2026-10-07", "UTC")).toBe("2026-10-07T15:05:00.000Z");
  });
});

describe("messageState", () => {
  const base: ScheduledMessageWire = {
    id: "1",
    creator_id: "1",
    guild_id: "1",
    channel_id: "1",
    message_id: null,
    thread_name: null,
    saved_message_id: "1",
    name: "Test",
    description: null,
    cron_expression: "0 12 * * *",
    cron_timezone: "UTC",
    cron_interval: 1,
    start_at: "2026-10-01T00:00:00Z",
    end_at: null,
    next_at: "2026-10-08T12:00:00Z",
    run_times: null,
    enabled: true,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    last_sent_at: null,
    last_error: null,
    last_error_at: null,
  };
  const dates = {
    cron_expression: null,
    run_times: ["2026-10-06T18:00:00Z", "2026-10-07T18:00:00Z"],
    next_at: "2026-10-07T18:00:00Z",
    enabled: false,
  };

  it("tells active, paused and ended apart", () => {
    expect(messageState(base)).toBe("active");
    expect(messageState({ ...base, last_error: "Missing Access" })).toBe(
      "active",
    );
    expect(messageState({ ...base, enabled: false })).toBe("paused");
    expect(
      messageState({ ...base, enabled: false, end_at: "2026-10-08T00:00:00Z" }),
    ).toBe("ended");
  });

  it("tells an error stopping it apart from the last date failing", () => {
    const error = { last_error: "Unknown Channel" };
    expect(
      messageState({
        ...base,
        ...error,
        enabled: false,
        last_error_at: "2026-10-07T12:00:00Z",
      }),
    ).toBe("stopped");
    expect(
      messageState({
        ...base,
        ...dates,
        ...error,
        last_error_at: "2026-10-06T18:00:00Z",
      }),
    ).toBe("stopped");
    expect(
      messageState({
        ...base,
        ...dates,
        ...error,
        last_error_at: "2026-10-07T18:00:01Z",
      }),
    ).toBe("failed");
  });

  it("is sent once the last date went out", () => {
    expect(
      messageState({ ...base, ...dates, last_sent_at: "2026-10-07T18:00:02Z" }),
    ).toBe("sent");
    expect(
      messageState({ ...base, ...dates, last_sent_at: "2026-10-06T18:00:02Z" }),
    ).toBe("paused");
  });
});
