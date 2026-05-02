/**
 * Billing GraphQL Mutations
 *
 * All client-side mutations for billing operations.
 * These will be used to generate React Query hooks.
 */

import { gql } from "graphql-request";

export const CREATE_CHECKOUT = gql`
  mutation CreateCheckout($planId: String!, $interval: String) {
    createCheckout(planId: $planId, interval: $interval) {
      url
      sessionId
    }
  }
`;

export const CREATE_CREDIT_CHECKOUT = gql`
  mutation CreateCreditCheckout($packId: String!) {
    createCreditCheckout(packId: $packId) {
      url
      sessionId
    }
  }
`;

export const CREATE_CUSTOMER_PORTAL = gql`
  mutation CreateCustomerPortal {
    createCustomerPortal {
      url
    }
  }
`;
