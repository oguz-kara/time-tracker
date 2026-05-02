import { gql } from "graphql-request";

export const USER_SETTINGS_FIELDS = gql`
  fragment UserSettingsFields on UserSettings {
    userId
    dailyGoalMinutes
    weekStartsOn
    timezone
    locale
  }
`;

export const GET_USER_SETTINGS = gql`
  query GetUserSettings {
    userSettings {
      ...UserSettingsFields
    }
  }
  ${USER_SETTINGS_FIELDS}
`;
