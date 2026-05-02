import { gql } from 'graphql-request';

/**
 * Projects GraphQL Queries
 * Used for client-side data fetching
 */

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      description
      organizationId
      createdAt
      updatedAt
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($id: String!) {
    project(id: $id) {
      id
      name
      description
      organizationId
      createdAt
      updatedAt
    }
  }
`;
