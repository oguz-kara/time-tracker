import { gql } from 'graphql-request';

export const GET_TASKS = gql`
  query GetTasks {
    tasks {
      id
      name
      description
      createdAt
      updatedAt
    }
  }
`;

export const GET_TASK = gql`
  query GetTask($id: String!) {
    task(id: $id) {
      id
      name
      description
      createdAt
      updatedAt
    }
  }
`;
