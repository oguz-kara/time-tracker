import { builder } from "@/lib/graphql/builder";
import * as projectsService from "./service";
import { NotAuthenticatedError } from "@/modules/shared/errors";

/**
 * Projects GraphQL API Layer
 * Thin resolvers that delegate to service layer
 */

// Create Pothos input types
const CreateProjectInput = builder.inputType("CreateProjectInput", {
  fields: (t) => ({
    name: t.string({
      required: true,
      validate: { minLength: 1, maxLength: 255 },
    }),
    description: t.string({ required: false }),
  }),
});

const UpdateProjectInput = builder.inputType("UpdateProjectInput", {
  fields: (t) => ({
    name: t.string({
      required: false,
      validate: { minLength: 1, maxLength: 255 },
    }),
    description: t.string({ required: false }),
  }),
});

// GraphQL Object Type
export const ProjectType = builder
  .objectRef<{
    id: string;
    name: string;
    description: string | null;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
  }>("Project")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      name: t.exposeString("name"),
      description: t.exposeString("description", { nullable: true }),
      organizationId: t.exposeString("organizationId"),
      createdAt: t.expose("createdAt", { type: "DateTime" }),
      updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    }),
  });

// Queries
builder.queryField("projects", (t) =>
  t.field({
    type: [ProjectType],
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return projectsService.list(ctx.session.activeOrganizationId);
    },
  })
);

builder.queryField("project", (t) =>
  t.field({
    type: ProjectType,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return projectsService.getById(args.id, ctx.session.activeOrganizationId);
    },
  })
);

// Mutations
builder.mutationField("createProject", (t) =>
  t.field({
    type: ProjectType,
    args: {
      input: t.arg({ type: CreateProjectInput }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      if (!args.input) {
        throw new Error("Input is required");
      }
      return projectsService.create(
        {
          name: args.input.name,
          description: args.input.description ?? null,
        },
        ctx.session.activeOrganizationId
      );
    },
  })
);

builder.mutationField("updateProject", (t) =>
  t.field({
    type: ProjectType,
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateProjectInput }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      const input = args.input ?? {};
      const updateData: Partial<{ name: string; description: string | null }> =
        {};
      if (input.name != null) updateData.name = input.name;
      if (input.description != null) updateData.description = input.description;
      return projectsService.update(
        args.id,
        updateData,
        ctx.session.activeOrganizationId
      );
    },
  })
);

builder.mutationField("deleteProject", (t) =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      await projectsService.deleteById(
        args.id,
        ctx.session.activeOrganizationId
      );
      return true;
    },
  })
);
