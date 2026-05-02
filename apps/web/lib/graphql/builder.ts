import SchemaBuilder from "@pothos/core";
import ErrorsPluginImport from "@pothos/plugin-errors";
import ZodPluginImport from "@pothos/plugin-zod";
import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import type { Context } from "./context";
import { BaseError } from "@/modules/shared/errors";

export const builder = new SchemaBuilder<{
  Context: Context;
  Scalars: {
    DateTime: {
      Input: Date;
      Output: Date;
    };
    JSON: {
      Input: any;
      Output: any;
    };
  };
  Plugins: [typeof ErrorsPluginImport, typeof ZodPluginImport];
}>({
  plugins: [ErrorsPluginImport, ZodPluginImport],
  errors: {
    defaultTypes: [BaseError],
    directResult: true,
  },
});

// Register custom scalars
builder.addScalarType("DateTime", DateTimeResolver, {});
builder.addScalarType("JSON", JSONResolver, {});

// Register base error type
builder.objectType(BaseError, {
  name: "BaseError",
  fields: (t) => ({
    message: t.exposeString("message"),
    code: t.exposeString("code"),
  }),
});

// Create root Query and Mutation types
builder.queryType({
  fields: (t) => ({
    health: t.string({
      resolve: () => "OK",
    }),
  }),
});

builder.mutationType({});
