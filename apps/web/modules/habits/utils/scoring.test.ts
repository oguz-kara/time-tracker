import { describe, it, expect } from "vitest";
import {
  computeDailyStreak,
  computeWeeklyStreak,
  computeDaysClean,
  completionPct,
  needsAttention,
  type ScoringHabit,
  type CheckLike,
} from "./scoring";

const TODAY = "2026-07-27"; // a Monday

const goodDaily: ScoringHabit = { type: "good", frequency: "daily", timesPerWeek: null };
const goodWeekly3: ScoringHabit = { type: "good", frequency: "weekly", timesPerWeek: 3 };
const bad: ScoringHabit = { type: "bad", frequency: "daily", timesPerWeek: null };

const done = (date: string): CheckLike => ({ date, kind: "done", count: 1 });
const slip = (date: string, count = 1): CheckLike => ({ date, kind: "slip", count });

describe("computeDailyStreak", () => {
  it("counts consecutive days ending today", () => {
    const dates = new Set(["2026-07-25", "2026-07-26", "2026-07-27"]);
    expect(computeDailyStreak(dates, TODAY)).toBe(3);
  });
  it("does not break on an unchecked today, but does on an unchecked yesterday", () => {
    expect(computeDailyStreak(new Set(["2026-07-25", "2026-07-26"]), TODAY)).toBe(2);
    expect(computeDailyStreak(new Set(["2026-07-24", "2026-07-25"]), TODAY)).toBe(0);
  });
  it("is 0 with no checks", () => {
    expect(computeDailyStreak(new Set(), TODAY)).toBe(0);
  });
});

describe("computeWeeklyStreak", () => {
  it("counts consecutive quota-met weeks and reports this week's count", () => {
    // Previous week (Jul 20–26): 3 checks → quota met. Week before (Jul 13–19): 3 checks.
    // Current week (starts Jul 27): 1 check so far → not yet part of the streak.
    const dates = [
      "2026-07-13", "2026-07-15", "2026-07-17",
      "2026-07-20", "2026-07-22", "2026-07-24",
      "2026-07-27",
    ];
    const r = computeWeeklyStreak(dates, TODAY, 3, 1);
    expect(r.weeks).toBe(2);
    expect(r.thisWeekCount).toBe(1);
  });
  it("includes the current week once its quota is met", () => {
    const r = computeWeeklyStreak(
      ["2026-07-20", "2026-07-22", "2026-07-24", "2026-07-27", "2026-07-28", "2026-07-29"],
      "2026-07-29",
      3,
      1
    );
    expect(r.weeks).toBe(2); // prev week + current week (quota met)
    expect(r.thisWeekCount).toBe(3);
  });
  it("breaks when the previous week missed quota", () => {
    const r = computeWeeklyStreak(["2026-07-21", "2026-07-13", "2026-07-15", "2026-07-17"], TODAY, 3, 1);
    expect(r.weeks).toBe(0);
  });
});

describe("computeDaysClean", () => {
  it("counts days since the last slip", () => {
    expect(computeDaysClean(["2026-07-20", "2026-07-24"], "2026-07-01", TODAY)).toBe(3);
  });
  it("is 0 when slipped today", () => {
    expect(computeDaysClean(["2026-07-27"], "2026-07-01", TODAY)).toBe(0);
  });
  it("falls back to tracking start when never slipped", () => {
    expect(computeDaysClean([], "2026-07-13", TODAY)).toBe(14);
  });
});

describe("completionPct", () => {
  it("good daily: doneDays / elapsedDays, clamped window", () => {
    // Sprint 2026-07-21..2026-08-03 (14 days), today = day 7. 5 done of 7 elapsed.
    const checks = ["2026-07-21", "2026-07-22", "2026-07-24", "2026-07-25", "2026-07-27"].map(done);
    expect(completionPct(goodDaily, checks, "2026-07-21", "2026-08-03", TODAY)).toBe(71);
  });
  it("good weekly: prorated expectation, capped at 100", () => {
    // 7 elapsed days → expected 3 × 7/7 = 3; 3 done → 100. 4 done → still 100.
    const checks3 = ["2026-07-21", "2026-07-23", "2026-07-25"].map(done);
    expect(completionPct(goodWeekly3, checks3, "2026-07-21", "2026-08-03", TODAY)).toBe(100);
    const checks4 = [...checks3, done("2026-07-26")];
    expect(completionPct(goodWeekly3, checks4, "2026-07-21", "2026-08-03", TODAY)).toBe(100);
  });
  it("bad: clean days / elapsed days; a slip day is not clean", () => {
    // 7 elapsed, 2 slip days → 5/7 = 71
    const checks = [slip("2026-07-22"), slip("2026-07-25", 3)];
    expect(completionPct(bad, checks, "2026-07-21", "2026-08-03", TODAY)).toBe(71);
  });
  it("after the sprint window ends, elapsed stops at endKey", () => {
    // Window 2026-07-01..2026-07-14, today far past. 14 done of 14 → 100.
    const checks: CheckLike[] = [];
    for (let d = 1; d <= 14; d++) checks.push(done(`2026-07-${String(d).padStart(2, "0")}`));
    expect(completionPct(goodDaily, checks, "2026-07-01", "2026-07-14", TODAY)).toBe(100);
  });
  it("ignores checks outside the window", () => {
    const checks = [done("2026-06-30"), done("2026-07-01")];
    expect(completionPct(goodDaily, checks, "2026-07-01", "2026-07-14", TODAY)).toBe(7); // 1/14
  });
});

describe("needsAttention", () => {
  it("daily: flags when no done in the last 3 days", () => {
    expect(needsAttention(goodDaily, [done("2026-07-24")], TODAY, 1)).toBe(true);
    expect(needsAttention(goodDaily, [done("2026-07-25")], TODAY, 1)).toBe(false);
  });
  it("weekly: flags when the previous week missed quota", () => {
    const met = ["2026-07-20", "2026-07-22", "2026-07-24"].map(done);
    expect(needsAttention(goodWeekly3, met, TODAY, 1)).toBe(false);
    expect(needsAttention(goodWeekly3, met.slice(0, 2), TODAY, 1)).toBe(true);
  });
  it("bad: flags on 2+ slips within the last 7 days (counts summed)", () => {
    expect(needsAttention(bad, [slip("2026-07-23", 2)], TODAY, 1)).toBe(true);
    expect(needsAttention(bad, [slip("2026-07-23")], TODAY, 1)).toBe(false);
    expect(needsAttention(bad, [slip("2026-07-19", 5)], TODAY, 1)).toBe(false); // outside window
  });
});
