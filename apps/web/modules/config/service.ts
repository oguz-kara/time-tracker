import { cache } from "react";
import { saasConfig } from "@/saas.config";
import { db } from "@jetframe/db";

export type AppConfig = {
  features: {
    blog: boolean;
    aiGeneration: boolean;
    admin: {
      enabled: boolean;
      impersonation: boolean;
    };
  };
  limits: {
    maxProjects: number;
    maxMembers: number;
    maxStorage: number;
  };
};

/**
 * Merges Static Config with Dynamic DB Settings.
 * Uses React Cache to prevent duplicate DB calls in the same request.
 *
 * @param orgId - Optional organization ID for org-specific overrides
 * @returns Merged configuration with dynamic overrides taking precedence
 */
export const getConfig = cache(async (orgId?: string): Promise<AppConfig> => {
  // 1. Start with Static Defaults (Fastest)
  const defaults: AppConfig = {
    features: {
      blog: saasConfig.features.blog,
      aiGeneration: saasConfig.features.aiGeneration,
      admin: {
        enabled: saasConfig.features.admin.enabled,
        impersonation: saasConfig.features.admin.impersonation,
      },
    },
    limits: saasConfig.billing.plans.free.limits,
  };

  // 2. If Org ID is provided, fetch Dynamic Overrides
  let overrides: Partial<AppConfig> = {};
  if (orgId) {
    try {
      const orgSettings = await db.query.organizationSettings.findFirst({
        where: (fields, { eq }) => eq(fields.orgId, orgId),
      });

      if (orgSettings?.config) {
        // Parse JSON config from database
        overrides = JSON.parse(
          orgSettings.config as string
        ) as Partial<AppConfig>;
      }
    } catch (error) {
      console.error("[Config Service] Failed to fetch org settings:", error);
      // Fall back to defaults on error
    }
  }

  // 3. Merge Logic (Dynamic > Static)
  return {
    features: {
      blog: overrides.features?.blog ?? defaults.features.blog,
      aiGeneration:
        overrides.features?.aiGeneration ?? defaults.features.aiGeneration,
      admin: {
        enabled:
          overrides.features?.admin?.enabled ?? defaults.features.admin.enabled,
        impersonation:
          overrides.features?.admin?.impersonation ??
          defaults.features.admin.impersonation,
      },
    },
    limits: {
      maxProjects: overrides.limits?.maxProjects ?? defaults.limits.maxProjects,
      maxMembers: overrides.limits?.maxMembers ?? defaults.limits.maxMembers,
      maxStorage: overrides.limits?.maxStorage ?? defaults.limits.maxStorage,
    },
  };
});

/**
 * Get configuration for a specific plan without org overrides
 */
export function getPlanConfig(
  planId: keyof typeof saasConfig.billing.plans
): AppConfig {
  const plan = saasConfig.billing.plans[planId];

  return {
    features: {
      blog: saasConfig.features.blog,
      aiGeneration: saasConfig.features.aiGeneration,
      admin: {
        enabled: saasConfig.features.admin.enabled,
        impersonation: saasConfig.features.admin.impersonation,
      },
    },
    limits: plan.limits,
  };
}
