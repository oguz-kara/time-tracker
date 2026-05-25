import { builder } from "@/lib/graphql/builder";
import * as service from "./service";
import { NotAuthenticatedError } from "@/modules/shared/errors";
import type { TimeEntry, DailyTotal, TagTotal } from "./types";
import * as userSettingsService from "@/modules/user-settings/service";

const TimeEntryRef = builder
  .objectRef<TimeEntry>("TimeEntry")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      userId: t.exposeString("userId"),
      organizationId: t.exposeString("organizationId"),
      start: t.expose("start", { type: "DateTime" }),
      stop: t.expose("stop", { type: "DateTime", nullable: true }),
      description: t.exposeString("description", { nullable: true }),
      tags: t.exposeStringList("tags"),
      createdAt: t.expose("createdAt", { type: "DateTime" }),
      updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    }),
  });

const DailyTotalRef = builder
  .objectRef<DailyTotal>("DailyTotal")
  .implement({
    fields: (t) => ({
      date: t.exposeString("date"),
      totalMinutes: t.exposeInt("totalMinutes"),
    }),
  });

const TagTotalRef = builder
  .objectRef<TagTotal>("TagTotal")
  .implement({
    fields: (t) => ({
      tag: t.exposeString("tag"),
      totalMinutes: t.exposeInt("totalMinutes"),
    }),
  });

const StartTimerInput = builder.inputType("StartTimerInput", {
  fields: (t) => ({
    description: t.string({ required: false }),
    tags: t.stringList({ required: false }),
  }),
});

const CreateEntryInput = builder.inputType("CreateEntryInput", {
  fields: (t) => ({
    start: t.field({ type: "DateTime", required: true }),
    stop: t.field({ type: "DateTime", required: true }),
    description: t.string({ required: false }),
    tags: t.stringList({ required: false }),
  }),
});

const UpdateEntryInput = builder.inputType("UpdateEntryInput", {
  fields: (t) => ({
    start: t.field({ type: "DateTime", required: false }),
    stop: t.field({ type: "DateTime", required: false }),
    description: t.string({ required: false }),
    tags: t.stringList({ required: false }),
  }),
});

// ---- Queries ----

builder.queryField("currentEntry", (t) =>
  t.field({
    type: TimeEntryRef,
    nullable: true,
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.getCurrentEntry(ctx.session.userId, ctx.session.activeOrganizationId);
    },
  })
);

builder.queryField("entries", (t) =>
  t.field({
    type: [TimeEntryRef],
    args: {
      from: t.arg({ type: "DateTime", required: true }),
      to: t.arg({ type: "DateTime", required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.listEntries(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.from,
        args.to
      );
    },
  })
);

builder.queryField("dailyTotals", (t) =>
  t.field({
    type: [DailyTotalRef],
    args: {
      from: t.arg({ type: "DateTime", required: true }),
      to: t.arg({ type: "DateTime", required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      const settings = await userSettingsService.getOrCreateUserSettings(ctx.session.userId);
      return service.getDailyTotals(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.from,
        args.to,
        settings.timezone
      );
    },
  })
);

builder.queryField("userTags", (t) =>
  t.field({
    type: ["String"],
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.listUserTags(
        ctx.session.userId,
        ctx.session.activeOrganizationId
      );
    },
  })
);

builder.queryField("tagTotals", (t) =>
  t.field({
    type: [TagTotalRef],
    args: {
      from: t.arg({ type: "DateTime", required: true }),
      to: t.arg({ type: "DateTime", required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.getTagTotals(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.from,
        args.to
      );
    },
  })
);

// ---- Mutations ----

builder.mutationField("startTimer", (t) =>
  t.field({
    type: TimeEntryRef,
    args: {
      input: t.arg({ type: StartTimerInput, required: false }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.startTimer(ctx.session.userId, ctx.session.activeOrganizationId, {
        description: args.input?.description ?? null,
        tags: args.input?.tags ?? [],
      });
    },
  })
);

builder.mutationField("stopTimer", (t) =>
  t.field({
    type: TimeEntryRef,
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.stopTimer(ctx.session.userId, ctx.session.activeOrganizationId);
    },
  })
);

builder.mutationField("createEntry", (t) =>
  t.field({
    type: TimeEntryRef,
    args: {
      input: t.arg({ type: CreateEntryInput, required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.createEntry(ctx.session.userId, ctx.session.activeOrganizationId, {
        start: args.input.start,
        stop: args.input.stop,
        description: args.input.description ?? null,
        tags: args.input.tags ?? [],
      });
    },
  })
);

builder.mutationField("updateEntry", (t) =>
  t.field({
    type: TimeEntryRef,
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateEntryInput, required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      const patch: {
        start?: Date;
        stop?: Date;
        description?: string | null;
        tags?: string[];
      } = {};
      if (args.input.start !== undefined && args.input.start !== null) patch.start = args.input.start;
      if (args.input.stop !== undefined && args.input.stop !== null) patch.stop = args.input.stop;
      if (args.input.description !== undefined) patch.description = args.input.description;
      if (args.input.tags !== undefined && args.input.tags !== null) patch.tags = args.input.tags;
      return service.updateEntry(ctx.session.userId, ctx.session.activeOrganizationId, args.id, patch);
    },
  })
);

builder.mutationField("deleteEntry", (t) =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      await service.deleteEntry(ctx.session.userId, ctx.session.activeOrganizationId, args.id);
      return true;
    },
  })
);
