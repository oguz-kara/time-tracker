import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:3000/api/graphql',
  documents: ['modules/**/graphql/documents/**/*.ts'],
  generates: {
    './lib/graphql/generated.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-query'
      ],
      config: {
        fetcher: {
          endpoint: 'http://localhost:3000/api/graphql',
          fetchParams: {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        },
        exposeQueryKeys: true,
        exposeFetcher: true,
        addInfiniteQuery: true,
        // React Query v5 configuration
        reactQueryVersion: 5,
      }
    }
  },
  hooks: {
    afterAllFileWrite: ['prettier --write']
  }
};

export default config;
