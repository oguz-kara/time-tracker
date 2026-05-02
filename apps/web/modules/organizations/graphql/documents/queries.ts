import { gql } from 'graphql-request';

/**
 * Get all organizations for the current user
 */
export const GET_USER_ORGANIZATIONS = gql`
  query GetUserOrganizations {
    userOrganizations {
      id
      name
      slug
      role
      logo
    }
  }
`;
