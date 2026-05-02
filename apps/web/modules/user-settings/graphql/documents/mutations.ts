import { gql } from "graphql-request";
import { USER_SETTINGS_FIELDS } from "./queries";

export const UPDATE_USER_SETTINGS = gql`
  mutation UpdateUserSettings($input: UpdateUserSettingsInput!) {
    updateUserSettings(input: $input) {
      ...UserSettingsFields
    }
  }
  ${USER_SETTINGS_FIELDS}
`;
