import { describe, expect, it } from "vitest";
import { fromZonedDate, listTimezones, rezone, toZonedDate } from "./time";

describe("zoned dates", () => {
  it("reads the picker's wall clock in the timezone", () => {
    const nine = new Date(2026, 8, 25, 9, 0);
    expect(fromZonedDate(nine, "Europe/Berlin")).toBe(
      "2026-09-25T07:00:00.000Z",
    );
    expect(fromZonedDate(nine, "America/New_York")).toBe(
      "2026-09-25T13:00:00.000Z",
    );
    expect(fromZonedDate(nine, "UTC")).toBe("2026-09-25T09:00:00.000Z");
  });

  it("uses the offset of the date, not of today", () => {
    // Berlin is on CET (+1) in December
    expect(fromZonedDate(new Date(2026, 11, 1, 9, 0), "Europe/Berlin")).toBe(
      "2026-12-01T08:00:00.000Z",
    );
    // the morning after Berlin switches back to CET
    expect(fromZonedDate(new Date(2026, 9, 25, 9, 0), "Europe/Berlin")).toBe(
      "2026-10-25T08:00:00.000Z",
    );
  });

  it("round trips through the picker", () => {
    for (const tz of ["Europe/Berlin", "America/New_York", "Asia/Kolkata"]) {
      const iso = "2026-09-25T07:30:00.000Z";
      expect(fromZonedDate(toZonedDate(iso, tz), tz)).toBe(iso);
    }
  });

  it("rezones wall clocks that don't exist in the local timezone", () => {
    // 02:30 is skipped in America/New_York that night, but exists in UTC and London
    expect(rezone("2027-03-14T02:30:00.000Z", "UTC", "Europe/London")).toBe(
      "2027-03-14T02:30:00.000Z",
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
