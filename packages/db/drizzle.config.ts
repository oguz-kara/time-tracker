import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from apps/web/.env
dotenv.config({ path: path.resolve(__dirname, "../../apps/web/.env") });

export default defineConfig({
  schema: [
    "./schema/auth.ts",
    "./schema/billing.ts",
    "./schema/ai.ts",
    "./schema/time_tracking.ts",
    "./schema/habits.ts",
    "../../apps/web/modules/projects/schema.ts",
    "../../apps/web/modules/tasks/schema.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
