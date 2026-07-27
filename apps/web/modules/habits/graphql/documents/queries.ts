import { gql } from "graphql-request";

export const HABIT_FIELDS = gql`
  fragment HabitFields on Habit {
    id
    name
    type
    frequency
    timesPerWeek
    status
    position
    intention
    starter
    identity
    notes
    createdAt
    updatedAt
  }
`;

export const SPRINT_FIELDS = gql`
  fragment SprintFields on Sprint {
    id
    name
    startsOn
    endsOn
    status
    retroNotes
    createdAt
  }
`;

export const GET_HABITS = gql`
  query GetHabits($status: String) {
    habits(status: $status) {
      ...HabitFields
    }
  }
  ${HABIT_FIELDS}
`;

export const GET_BACKLOG_FOR_PLANNING = gql`
  query GetBacklogForPlanning {
    backlogForPlanning {
      habit {
        ...HabitFields
      }
      lastOutcome
    }
  }
  ${HABIT_FIELDS}
`;

export const GET_DAILY_CHECKLIST = gql`
  query GetDailyChecklist($date: String!) {
    dailyChecklist(date: $date) {
      habit {
        ...HabitFields
      }
      checkedToday
      slipCountToday
      streak
      thisWeekCount
      needsAttention
    }
  }
  ${HABIT_FIELDS}
`;

export const GET_ACTIVE_SPRINT = gql`
  query GetActiveSprint {
    activeSprint {
      sprint {
        ...SprintFields
      }
      dayNumber
      totalDays
      overallPct
      isPastEnd
      members {
        habit {
          ...HabitFields
        }
        completionPct
        outcome
      }
    }
  }
  ${HABIT_FIELDS}
  ${SPRINT_FIELDS}
`;

export const GET_COMPLETED_SPRINTS = gql`
  query GetCompletedSprints {
    completedSprints {
      sprint {
        ...SprintFields
      }
      overallPct
      members {
        habit {
          ...HabitFields
        }
        completionPct
        outcome
      }
    }
  }
  ${HABIT_FIELDS}
  ${SPRINT_FIELDS}
`;
