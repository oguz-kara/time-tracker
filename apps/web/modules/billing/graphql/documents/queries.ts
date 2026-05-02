/**
 * Billing GraphQL Queries
 *
 * All client-side queries for billing data.
 * These will be used to generate React Query hooks.
 */

import { gql } from "graphql-request";

export const GET_CREDIT_BALANCE = gql`
  query GetCreditBalance {
    creditBalance {
      balance
      planId
      subscriptionStatus
      cancelAtPeriodEnd
      subscriptionEndDate
      currentPeriodEnd
    }
  }
`;

export const GET_CREDIT_HISTORY = gql`
  query GetCreditHistory($limit: Int) {
    creditHistory(limit: $limit) {
      id
      amount
      type
      description
      balanceAfter
      createdAt
      metadata
    }
  }
`;

export const GET_BILLING_PLANS = gql`
  query GetBillingPlans {
    billingPlans {
      id
      name
      description
      priceMonthly
      priceYearly
      creditsPerMonth
      features
    }
  }
`;

export const GET_CREDIT_PACKS = gql`
  query GetCreditPacks {
    creditPacks {
      id
      name
      credits
      price
    }
  }
`;
