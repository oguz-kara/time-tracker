import type { InferSelectModel } from "@jetframe/db";
import { userSettings } from "@jetframe/db/schema/time-tracking";

export type UserSettings = InferSelectModel<typeof userSettings>;
