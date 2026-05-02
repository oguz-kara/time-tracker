import { builder } from "@/lib/graphql/builder";
import { taskService } from "./service";
import { NotAuthenticatedError } from "@/modules/shared/errors";

/**
 * Task GraphQL Type
 */
const Task = builder
  .objectRef<{
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>("Task")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      organizationId: t.exposeString("organizationId"),
      name: t.exposeString("name"),
      description: t.exposeString("description", { nullable: true }),
      createdAt: t.expose("createdAt", { type: "DateTime" }),
      updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    }),
  });

/**
 * Input Types
 */
const CreateTaskInput = builder.inputType("CreateTaskInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string({ required: false }),
  }),
});

const UpdateTaskInput = builder.inputType("UpdateTaskInput", {
  fields: (t) => ({
    name: t.string({ required: false }),
    description: t.string({ required: false }),
  }),
});

/**
 * Queries
 */
builder.queryFields((t) => ({
  tasks: t.field({
    type: [Task],
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return taskService.getAllTasks(ctx.session.activeOrganizationId);
    },
  }),
  task: t.field({
    type: Task,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return taskService.getTask(args.id, ctx.session.activeOrganizationId);
    },
  }),
}));

/**
 * Mutations
 */
builder.mutationFields((t) => ({
  createTask: t.field({
    type: Task,
    args: {
      input: t.arg({ type: CreateTaskInput, required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return taskService.createTask(
        {
          name: args.input.name,
          description: args.input.description ?? undefined,
        },
        ctx.session.activeOrganizationId
      );
    },
  }),
  updateTask: t.field({
    type: Task,
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateTaskInput, required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return taskService.updateTask(
        args.id,
        {
          name: args.input.name ?? undefined,
          description: args.input.description ?? undefined,
        },
        ctx.session.activeOrganizationId
      );
    },
  }),
  deleteTask: t.field({
    type: Task,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return taskService.deleteTask(args.id, ctx.session.activeOrganizationId);
    },
  }),
}));
