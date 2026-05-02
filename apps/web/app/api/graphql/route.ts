import { createYoga } from "graphql-yoga";
import { schema } from "@/lib/graphql/schema";
import { createContext } from "@/lib/graphql/context";
import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

const yoga = createYoga({
  schema,
  context: async (req) => {
    return createContext(req.request as NextRequest);
  },
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Request, Response },
  graphiql: process.env.NODE_ENV === "development",
  maskedErrors: {
    maskError(error): Error {
      const err = error as Error & {
        path?: unknown;
        extensions?: unknown;
      };

      // Send to Sentry in all environments (Sentry handles dev vs prod internally)
      Sentry.captureException(err, {
        contexts: {
          graphql: {
            path: err.path,
            extensions: err.extensions,
          },
        },
      });

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.error("[GraphQL Error]", {
          message: err.message,
          path: err.path,
          extensions: err.extensions,
        });
      }

      // Return a generic error to clients in production
      if (process.env.NODE_ENV === "production") {
        return new Error("Internal server error");
      }

      // In development, return the actual error for debugging
      return err instanceof Error ? err : new Error(String(error));
    },
  },
});

export { yoga as GET, yoga as POST, yoga as OPTIONS };
