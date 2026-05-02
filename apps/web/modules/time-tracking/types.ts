import type { InferSelectModel, InferInsertModel } from "@jetframe/db";
import { timeEntries } from "@jetframe/db/schema/time-tracking";

export type TimeEntry = InferSelectModel<typeof timeEntries>;
export type NewTimeEntry = InferInsertModel<typeof timeEntries>;

export interface DailyTotal {
  date: string; // YYYY-MM-DD in user's tz
  totalMinutes: number;
}
