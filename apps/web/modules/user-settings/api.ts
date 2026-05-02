import { builder } from "@/lib/graphql/builder";
import * as service from "./service";
import { NotAuthenticatedError } from "@/modules/shared/errors";
import type { UserSettings } from "./types";

const UserSettingsRef = builder
  .objectRef<UserSettings>("UserSettings")
  .implement({
    fields: (t) => ({
      userId: t.exposeString("userId"),
      dailyGoalMinutes: t.exposeInt("dailyGoalMinutes"),
      weekStartsOn: t.exposeInt("weekStartsOn"),
      timezone: t.exposeString("timezone"),
      locale: t.exposeString("locale"),
      createdAt: t.expose("createdAt", { type: "DateTime" }),
      updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    }),
  });

const UpdateUserSettingsInput = builder.inputType("UpdateUserSettingsInput", {
  fields: (t) => ({
    dailyGoalMinutes: t.int({ required: false }),
    weekStartsOn: t.int({ required: false }),
    timezone: t.string({ required: false }),
    locale: t.string({ required: false }),
  }),
});

builder.queryField("userSettings", (t) =>
  t.field({
    type: UserSettingsRef,
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.getOrCreateUserSettings(ctx.session.userId);
    },
  })
);

builder.mutationField("updateUserSettings", (t) =>
  t.field({
    type: UserSettingsRef,
    args: {
      input: t.arg({ type: UpdateUserSettingsInput, required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.updateUserSettings(ctx.session.userId, {
        dailyGoalMinutes: args.input.dailyGoalMinutes ?? undefined,
        weekStartsOn: args.input.weekStartsOn ?? undefined,
        timezone: args.input.timezone ?? undefined,
        locale: args.input.locale ?? undefined,
      });
    },
  })
);
