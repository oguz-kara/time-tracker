import { builder } from "@/lib/graphql/builder";
import * as service from "./service";
import * as userSettingsService from "@/modules/user-settings/service";
import { NotAuthenticatedError } from "@/modules/shared/errors";
import type {
  Habit,
  Sprint,
  ChecklistItem,
  ActiveSprintView,
  CompletedSprintView,
  SprintMemberProgress,
  BacklogPlanningHabit,
} from "./types";

/** timezone + weekStartsOn straight from user settings, resolver-side. */
async function getPrefs(userId: string): Promise<{ timezone: string; weekStartsOn: 0 | 1 }> {
  const settings = await userSettingsService.getOrCreateUserSettings(userId);
  return {
    timezone: settings.timezone,
    weekStartsOn: (settings.weekStartsOn === 0 ? 0 : 1) as 0 | 1,
  };
}

// ---- Object types ----

const HabitRef = builder.objectRef<Habit>("Habit").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    type: t.exposeString("type"),
    frequency: t.exposeString("frequency"),
    timesPerWeek: t.exposeInt("timesPerWeek", { nullable: true }),
    status: t.exposeString("status"),
    position: t.exposeInt("position"),
    intention: t.exposeString("intention", { nullable: true }),
    starter: t.exposeString("starter", { nullable: true }),
    identity: t.exposeString("identity", { nullable: true }),
    notes: t.exposeString("notes", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

const SprintRef = builder.objectRef<Sprint>("Sprint").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    startsOn: t.exposeString("startsOn"),
    endsOn: t.exposeString("endsOn"),
    status: t.exposeString("status"),
    retroNotes: t.exposeString("retroNotes", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

const ChecklistItemRef = builder.objectRef<ChecklistItem>("ChecklistItem").implement({
  fields: (t) => ({
    habit: t.field({ type: HabitRef, resolve: (i) => i.habit }),
    checkedToday: t.exposeBoolean("checkedToday"),
    slipCountToday: t.exposeInt("slipCountToday"),
    streak: t.exposeInt("streak"),
    thisWeekCount: t.exposeInt("thisWeekCount"),
    needsAttention: t.exposeBoolean("needsAttention"),
  }),
});

const SprintMemberProgressRef = builder
  .objectRef<SprintMemberProgress>("SprintMemberProgress")
  .implement({
    fields: (t) => ({
      habit: t.field({ type: HabitRef, resolve: (m) => m.habit }),
      completionPct: t.exposeInt("completionPct"),
      outcome: t.exposeString("outcome", { nullable: true }),
    }),
  });

const ActiveSprintViewRef = builder
  .objectRef<ActiveSprintView>("ActiveSprintView")
  .implement({
    fields: (t) => ({
      sprint: t.field({ type: SprintRef, resolve: (v) => v.sprint }),
      dayNumber: t.exposeInt("dayNumber"),
      totalDays: t.exposeInt("totalDays"),
      overallPct: t.exposeInt("overallPct"),
      isPastEnd: t.exposeBoolean("isPastEnd"),
      members: t.field({ type: [SprintMemberProgressRef], resolve: (v) => v.members }),
    }),
  });

const CompletedSprintViewRef = builder
  .objectRef<CompletedSprintView>("CompletedSprintView")
  .implement({
    fields: (t) => ({
      sprint: t.field({ type: SprintRef, resolve: (v) => v.sprint }),
      overallPct: t.exposeInt("overallPct"),
      members: t.field({ type: [SprintMemberProgressRef], resolve: (v) => v.members }),
    }),
  });

const BacklogPlanningHabitRef = builder
  .objectRef<BacklogPlanningHabit>("BacklogPlanningHabit")
  .implement({
    fields: (t) => ({
      habit: t.field({ type: HabitRef, resolve: (b) => b.habit }),
      lastOutcome: t.exposeString("lastOutcome", { nullable: true }),
    }),
  });

// ---- Inputs ----

const HabitInputType = builder.inputType("HabitInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    type: t.string({ required: true }),
    frequency: t.string({ required: false }),
    timesPerWeek: t.int({ required: false }),
    position: t.int({ required: false }),
    intention: t.string({ required: false }),
    starter: t.string({ required: false }),
    identity: t.string({ required: false }),
    notes: t.string({ required: false }),
  }),
});

const UpdateHabitInput = builder.inputType("UpdateHabitInput", {
  fields: (t) => ({
    name: t.string({ required: false }),
    type: t.string({ required: false }),
    frequency: t.string({ required: false }),
    timesPerWeek: t.int({ required: false }),
    position: t.int({ required: false }),
    intention: t.string({ required: false }),
    starter: t.string({ required: false }),
    identity: t.string({ required: false }),
    notes: t.string({ required: false }),
  }),
});

const StartSprintInput = builder.inputType("StartSprintInput", {
  fields: (t) => ({
    lengthWeeks: t.int({ required: true }),
    habitIds: t.stringList({ required: true }),
    name: t.string({ required: false }),
  }),
});

const RetroDecisionInput = builder.inputType("RetroDecisionInput", {
  fields: (t) => ({
    habitId: t.string({ required: true }),
    outcome: t.string({ required: true }),
  }),
});

// ---- Queries ----

builder.queryField("habits", (t) =>
  t.field({
    type: [HabitRef],
    args: {
      status: t.arg.string({ required: false }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.listHabits(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.status ?? null
      );
    },
  })
);

builder.queryField("backlogForPlanning", (t) =>
  t.field({
    type: [BacklogPlanningHabitRef],
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.listBacklogForPlanning(ctx.session.userId, ctx.session.activeOrganizationId);
    },
  })
);

builder.queryField("dailyChecklist", (t) =>
  t.field({
    type: [ChecklistItemRef],
    args: {
      date: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      const prefs = await getPrefs(ctx.session.userId);
      return service.getDailyChecklist(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.date,
        prefs.timezone,
        prefs.weekStartsOn
      );
    },
  })
);

builder.queryField("activeSprint", (t) =>
  t.field({
    type: ActiveSprintViewRef,
    nullable: true,
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      const prefs = await getPrefs(ctx.session.userId);
      return service.getActiveSprintView(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        prefs.timezone
      );
    },
  })
);

builder.queryField("completedSprints", (t) =>
  t.field({
    type: [CompletedSprintViewRef],
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.listCompletedSprints(ctx.session.userId, ctx.session.activeOrganizationId);
    },
  })
);

// ---- Mutations ----

builder.mutationField("createHabit", (t) =>
  t.field({
    type: HabitRef,
    args: {
      input: t.arg({ type: HabitInputType, required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.createHabit(ctx.session.userId, ctx.session.activeOrganizationId, {
        name: args.input.name,
        type: args.input.type,
        frequency: args.input.frequency ?? null,
        timesPerWeek: args.input.timesPerWeek ?? null,
        position: args.input.position ?? null,
        intention: args.input.intention ?? null,
        starter: args.input.starter ?? null,
        identity: args.input.identity ?? null,
        notes: args.input.notes ?? null,
      });
    },
  })
);

builder.mutationField("updateHabit", (t) =>
  t.field({
    type: HabitRef,
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateHabitInput, required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      // undefined = leave unchanged; null = clear (nullable text fields only)
      const patch: Partial<service.HabitInput> = {};
      if (args.input.name != null) patch.name = args.input.name;
      if (args.input.type != null) patch.type = args.input.type;
      if (args.input.frequency != null) patch.frequency = args.input.frequency;
      if (args.input.timesPerWeek !== undefined) patch.timesPerWeek = args.input.timesPerWeek;
      if (args.input.position !== undefined && args.input.position !== null) patch.position = args.input.position;
      if (args.input.intention !== undefined) patch.intention = args.input.intention;
      if (args.input.starter !== undefined) patch.starter = args.input.starter;
      if (args.input.identity !== undefined) patch.identity = args.input.identity;
      if (args.input.notes !== undefined) patch.notes = args.input.notes;
      return service.updateHabit(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.id,
        patch
      );
    },
  })
);

builder.mutationField("dropHabit", (t) =>
  t.field({
    type: HabitRef,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.dropHabit(ctx.session.userId, ctx.session.activeOrganizationId, args.id);
    },
  })
);

builder.mutationField("startSprint", (t) =>
  t.field({
    type: SprintRef,
    args: {
      input: t.arg({ type: StartSprintInput, required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      const prefs = await getPrefs(ctx.session.userId);
      return service.startSprint(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        prefs.timezone,
        {
          lengthWeeks: args.input.lengthWeeks,
          habitIds: args.input.habitIds,
          name: args.input.name ?? null,
        }
      );
    },
  })
);

builder.mutationField("addHabitToSprint", (t) =>
  t.field({
    type: "Boolean",
    args: {
      habitId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      await service.addHabitToSprint(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.habitId
      );
      return true;
    },
  })
);

builder.mutationField("removeHabitFromSprint", (t) =>
  t.field({
    type: "Boolean",
    args: {
      habitId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      const prefs = await getPrefs(ctx.session.userId);
      await service.removeHabitFromSprint(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.habitId,
        prefs.timezone
      );
      return true;
    },
  })
);

builder.mutationField("toggleCheck", (t) =>
  t.field({
    type: "Boolean",
    args: {
      habitId: t.arg.string({ required: true }),
      date: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      const prefs = await getPrefs(ctx.session.userId);
      return service.toggleCheck(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.habitId,
        args.date,
        prefs.timezone
      );
    },
  })
);

builder.mutationField("logSlip", (t) =>
  t.field({
    type: "Int",
    args: {
      habitId: t.arg.string({ required: true }),
      date: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      const prefs = await getPrefs(ctx.session.userId);
      return service.logSlip(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.habitId,
        args.date,
        prefs.timezone
      );
    },
  })
);

builder.mutationField("undoSlip", (t) =>
  t.field({
    type: "Int",
    args: {
      habitId: t.arg.string({ required: true }),
      date: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      const prefs = await getPrefs(ctx.session.userId);
      return service.undoSlip(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.habitId,
        args.date,
        prefs.timezone
      );
    },
  })
);

builder.mutationField("completeRetro", (t) =>
  t.field({
    type: "Boolean",
    args: {
      sprintId: t.arg.string({ required: true }),
      decisions: t.arg({ type: [RetroDecisionInput], required: true }),
      retroNotes: t.arg.string({ required: false }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      const prefs = await getPrefs(ctx.session.userId);
      await service.completeRetro(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.sprintId,
        args.decisions.map((d) => ({ habitId: d.habitId, outcome: d.outcome })),
        args.retroNotes ?? null,
        prefs.timezone
      );
      return true;
    },
  })
);
