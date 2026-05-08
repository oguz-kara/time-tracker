import { gql } from "graphql-request";

export const TIME_ENTRY_FIELDS = gql`
  fragment TimeEntryFields on TimeEntry {
    id
    start
    stop
    description
    tags
    createdAt
    updatedAt
  }
`;

export const GET_CURRENT_ENTRY = gql`
  query GetCurrentEntry {
    currentEntry {
      ...TimeEntryFields
    }
  }
  ${TIME_ENTRY_FIELDS}
`;

export const GET_ENTRIES = gql`
  query GetEntries($from: DateTime!, $to: DateTime!) {
    entries(from: $from, to: $to) {
      ...TimeEntryFields
    }
  }
  ${TIME_ENTRY_FIELDS}
`;

export const GET_DAILY_TOTALS = gql`
  query GetDailyTotals($from: DateTime!, $to: DateTime!) {
    dailyTotals(from: $from, to: $to) {
      date
      totalMinutes
    }
  }
`;

export const GET_USER_TAGS = gql`
  query GetUserTags {
    userTags
  }
`;
