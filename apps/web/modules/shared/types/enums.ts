import { builder } from '@/lib/graphql/builder';

/**
 * Shared GraphQL enum types
 */

export const UserRole = builder.enumType('UserRole', {
  values: ['user', 'admin'] as const,
});

export const MemberRole = builder.enumType('MemberRole', {
  values: ['owner', 'admin', 'member'] as const,
});

export const SubscriptionStatus = builder.enumType('SubscriptionStatus', {
  values: ['active', 'canceled', 'past_due', 'trialing', 'incomplete'] as const,
});
