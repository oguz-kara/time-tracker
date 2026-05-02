import { gql } from 'graphql-request';

/**
 * Adjust credits for an organization (admin only)
 */
export const ADMIN_ADJUST_CREDITS = gql`
  mutation AdminAdjustCredits($organizationId: String!, $amount: Int!, $reason: String!) {
    adminAdjustCredits(organizationId: $organizationId, amount: $amount, reason: $reason) {
      organizationId
      previousBalance
      newBalance
      adjustmentAmount
      reason
    }
  }
`;
