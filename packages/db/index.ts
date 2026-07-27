// Load environment variables first (for standalone scripts)
import { config } from "dotenv";
import { resolve } from "path";

// Try to load .env from apps/web/ if it exists
try {
  config({ path: resolve(__dirname, "../../apps/web/.env") });
} catch (e) {
  // Ignore if .env doesn't exist (e.g., in production with env vars set)
}

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Import all schemas
import * as auth from "./schema/auth";
import * as billing from "./schema/billing";
import * as ai from "./schema/ai";
import * as files from "./schema/files";
import * as projects from "./schema/projects";
import * as tasks from "./schema/tasks";
import * as notifications from "./schema/notifications";
import * as timeTracking from "./schema/time_tracking";
import * as habitsSchema from "./schema/habits";

// Create postgres connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });

// Create drizzle instance
export const db = drizzle(client, {
  schema: {
    ...auth,
    ...billing,
    ...ai,
    ...files,
    ...projects,
    ...tasks,
    ...notifications,
    ...timeTracking,
    ...habitsSchema,
  },
});

// Export schemas
export * from "./schema/auth";
export * from "./schema/billing";
export * from "./schema/ai";
export * from "./schema/files";
export * from "./schema/projects";
export * from "./schema/tasks";
export * from "./schema/notifications";
export * from "./schema/time_tracking";
export * from "./schema/habits";
export * from "./utils/pagination";

// Export drizzle-orm operators and types to ensure single instance
export { eq, and, or, desc, asc, sql, inArray, gte, lte, lt, ne, isNull } from "drizzle-orm";
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";
