import { gql } from "graphql-request";
import { TIME_ENTRY_FIELDS } from "./queries";

export const START_TIMER = gql`
  mutation StartTimer($input: StartTimerInput) {
    startTimer(input: $input) {
      ...TimeEntryFields
    }
  }
  ${TIME_ENTRY_FIELDS}
`;

export const STOP_TIMER = gql`
  mutation StopTimer {
    stopTimer {
      ...TimeEntryFields
    }
  }
  ${TIME_ENTRY_FIELDS}
`;

export const CREATE_ENTRY = gql`
  mutation CreateEntry($input: CreateEntryInput!) {
    createEntry(input: $input) {
      ...TimeEntryFields
    }
  }
  ${TIME_ENTRY_FIELDS}
`;

export const UPDATE_ENTRY = gql`
  mutation UpdateEntry($id: String!, $input: UpdateEntryInput!) {
    updateEntry(id: $id, input: $input) {
      ...TimeEntryFields
    }
  }
  ${TIME_ENTRY_FIELDS}
`;

export const DELETE_ENTRY = gql`
  mutation DeleteEntry($id: String!) {
    deleteEntry(id: $id)
  }
`;
