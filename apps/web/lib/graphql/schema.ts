import { builder } from "./builder";

// Import all module resolvers (Order matters for type references)
import "@/modules/shared/types/scalars";
import "@/modules/shared/types/enums";
import "@/modules/organizations/api";
import "@/modules/projects/api";
import "@/modules/tasks/api";
import "@/modules/billing/api";
import "@/modules/storage/api";
import "@/modules/notifications/api";

// TODO: Import domain module resolvers here
// import '@/modules/auth/api';
import "@/modules/admin/api";
import "@/modules/user-settings/api";
import "@/modules/time-tracking/api";
import "@/modules/habits/api";

// Build and export the schema
export const schema = builder.toSchema();
