import type { InferSelectModel, InferInsertModel } from "@jetframe/db";
import { habits, sprints, sprintHabits, habitChecks } from "@jetframe/db/schema/habits";

export type Habit = InferSelectModel<typeof habits>;
export type NewHabit = InferInsertModel<typeof habits>;
export type Sprint = InferSelectModel<typeof sprints>;
export type SprintHabit = InferSelectModel<typeof sprintHabits>;
export type HabitCheck = InferSelectModel<typeof habitChecks>;

/** Allowed string values (GraphQL exposes plain String; service validates). */
export const HABIT_TYPES = ["good", "bad"] as const;
export const HABIT_FREQUENCIES = ["daily", "weekly"] as const;
export const HABIT_STATUSES = ["backlog", "in_sprint", "established", "dropped"] as const;
export const SPRINT_OUTCOMES = ["graduated", "carried", "returned", "dropped"] as const;

/** One row of the Today checklist. `streak` unit depends on the habit:
 *  daily → days, weekly → weeks, bad → days clean. */
export interface ChecklistItem {
  habit: Habit;
  checkedToday: boolean;
  slipCountToday: number;
  streak: number;
  thisWeekCount: number;
  needsAttention: boolean;
}

export interface SprintMemberProgress {
  habit: Habit;
  completionPct: number;
  outcome: string | null;
}

export interface ActiveSprintView {
  sprint: Sprint;
  dayNumber: number;
  totalDays: number;
  overallPct: number;
  isPastEnd: boolean;
  members: SprintMemberProgress[];
}

export interface CompletedSprintView {
  sprint: Sprint;
  overallPct: number;
  members: SprintMemberProgress[];
}

/** Backlog habit + its most recent sprint outcome (planner pre-checks 'carried'). */
export interface BacklogPlanningHabit {
  habit: Habit;
  lastOutcome: string | null;
}
