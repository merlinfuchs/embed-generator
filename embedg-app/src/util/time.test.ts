import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  listTimezones,
  rezone,
  timezoneOrUTC,
  zonedDate,
  zonedDateTime,
} from "./time";

describe("rezone", () => {
  // Pin the local zone so the conversions don't go through the local zone's DST by accident.
  beforeAll(() => {
    vi.stubEnv("TZ", "America/New_York");
  });
  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("rezones wall clocks that don't exist in the local timezone", () => {
    // 02:30 is skipped in America/New_York that night, but exists in UTC and London
    expect(rezone("2027-03-14T02:30:00.000Z", "UTC", "Europe/London")).toBe(
      "2027-03-14T02:30:00.000Z",
    );
  });

  it("moves wall clocks skipped by DST forward", () => {
    // 02:30 doesn't exist in New York on 2027-03-14 or in Berlin on 2027-03-28
    expect(rezone("2027-03-14T02:30:00.000Z", "UTC", "America/New_York")).toBe(
      "2027-03-14T07:30:00.000Z",
    );
    expect(rezone("2027-03-28T02:30:00.000Z", "UTC", "Europe/Berlin")).toBe(
      "2027-03-28T01:30:00.000Z",
    );
  });

  it("keeps the wall clock when switching timezones", () => {
    expect(rezone("2026-09-25T07:00:00.000Z", "Europe/Berlin", "UTC")).toBe(
      "2026-09-25T09:00:00.000Z",
    );
  });
});

describe("listTimezones", () => {
  it("puts UTC first, once", () => {
    const tzs = listTimezones();
    expect(tzs[0]).toBe("UTC");
    expect(tzs.filter((tz) => tz === "UTC")).toHaveLength(1);
    expect(tzs).toContain("Europe/Berlin");
  });
});

describe("timezoneOrUTC", () => {
  it("falls back to UTC for missing and unknown zones", () => {
    expect(timezoneOrUTC("Europe/Berlin")).toBe("Europe/Berlin");
    expect(timezoneOrUTC(null)).toBe("UTC");
    expect(timezoneOrUTC("")).toBe("UTC");
    expect(timezoneOrUTC("Etc/Unknown")).toBe("UTC");
  });
});

describe("zoned calendar dates", () => {
  it("reads the date in the timezone, not in UTC", () => {
    // 23:30 in New York is already the next day in UTC.
    expect(zonedDate("2026-10-08T03:30:00.000Z", "America/New_York")).toBe(
      "2026-10-07",
    );
    expect(zonedDate("2026-10-08T03:30:00.000Z", "UTC")).toBe("2026-10-08");
  });

  it("turns a date and wall clock into the instant", () => {
    expect(zonedDateTime("2026-10-07", "America/Denver", 0, 0)).toBe(
      "2026-10-07T06:00:00.000Z",
    );
    // Denver is back on standard time after Nov 1.
    expect(zonedDateTime("2026-11-02", "America/Denver", 23, 59, 59)).toBe(
      "2026-11-03T06:59:59.000Z",
    );
  });
});
