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
          // Relative URL so the request always hits the same origin the page
          // was served from. Hardcoding localhost broke production; absolute
          // production URLs would break local dev. Relative just works.
          // Note: the plugin renders this as a TS expression, so we wrap it
          // in extra quotes to emit a proper string literal in generated.ts.
          endpoint: "'/api/graphql'",
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
