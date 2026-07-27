import { describe, it, expect } from "vitest";
import { dateKeyInTz, addDays, diffDays, weekStartKey } from "./dates";

describe("dateKeyInTz", () => {
  it("keys an instant by the user's timezone, not UTC", () => {
    // 2026-07-26 22:30 UTC is already 2026-07-27 in Istanbul (UTC+3)
    const instant = new Date("2026-07-26T22:30:00Z");
    expect(dateKeyInTz(instant, "Europe/Istanbul")).toBe("2026-07-27");
    expect(dateKeyInTz(instant, "UTC")).toBe("2026-07-26");
  });
});

describe("addDays", () => {
  it("adds and subtracts across month boundaries", () => {
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDays("2026-08-01", -1)).toBe("2026-07-31");
  });
  it("crosses years", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("diffDays", () => {
  it("returns signed whole-day difference a - b", () => {
    expect(diffDays("2026-07-27", "2026-07-20")).toBe(7);
    expect(diffDays("2026-07-20", "2026-07-27")).toBe(-7);
    expect(diffDays("2026-07-27", "2026-07-27")).toBe(0);
  });
});

describe("weekStartKey", () => {
  it("finds Monday for weekStartsOn=1", () => {
    // 2026-07-27 is a Monday
    expect(weekStartKey("2026-07-27", 1)).toBe("2026-07-27");
    expect(weekStartKey("2026-07-30", 1)).toBe("2026-07-27"); // Thursday
    expect(weekStartKey("2026-08-02", 1)).toBe("2026-07-27"); // Sunday
  });
  it("finds Sunday for weekStartsOn=0", () => {
    expect(weekStartKey("2026-07-27", 0)).toBe("2026-07-26"); // Mon → prev Sunday
    expect(weekStartKey("2026-07-26", 0)).toBe("2026-07-26");
  });
});
