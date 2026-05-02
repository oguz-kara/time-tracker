import { GraphQLClient } from 'graphql-request';

/**
 * GraphQL client for Server Components
 * Uses graphql-request for lightweight fetching
 */
export function getGraphQLClient(token?: string) {
  return new GraphQLClient(
    process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/graphql`
      : 'http://localhost:3000/api/graphql',
    {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }
  );
}

/**
 * Default GraphQL client without auth
 */
export const graphqlClient = getGraphQLClient();
