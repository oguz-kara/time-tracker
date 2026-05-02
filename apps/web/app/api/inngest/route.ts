/**
 * Inngest Serve Endpoint
 *
 * This endpoint serves all Inngest functions and handles:
 * - Function registration
 * - Event triggering
 * - Execution monitoring
 *
 * In development: Uses Inngest Dev Server (http://localhost:8288)
 * In production: Connects to Inngest Cloud
 */

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import * as functions from "@/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: Object.values(functions),
});
