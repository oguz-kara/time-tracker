import { gql } from "graphql-request";
import { HABIT_FIELDS, SPRINT_FIELDS } from "./queries";

export const CREATE_HABIT = gql`
  mutation CreateHabit($input: HabitInput!) {
    createHabit(input: $input) {
      ...HabitFields
    }
  }
  ${HABIT_FIELDS}
`;

export const UPDATE_HABIT = gql`
  mutation UpdateHabit($id: String!, $input: UpdateHabitInput!) {
    updateHabit(id: $id, input: $input) {
      ...HabitFields
    }
  }
  ${HABIT_FIELDS}
`;

export const DROP_HABIT = gql`
  mutation DropHabit($id: String!) {
    dropHabit(id: $id) {
      ...HabitFields
    }
  }
  ${HABIT_FIELDS}
`;

export const START_SPRINT = gql`
  mutation StartSprint($input: StartSprintInput!) {
    startSprint(input: $input) {
      ...SprintFields
    }
  }
  ${SPRINT_FIELDS}
`;

export const ADD_HABIT_TO_SPRINT = gql`
  mutation AddHabitToSprint($habitId: String!) {
    addHabitToSprint(habitId: $habitId)
  }
`;

export const REMOVE_HABIT_FROM_SPRINT = gql`
  mutation RemoveHabitFromSprint($habitId: String!) {
    removeHabitFromSprint(habitId: $habitId)
  }
`;

export const TOGGLE_CHECK = gql`
  mutation ToggleCheck($habitId: String!, $date: String!) {
    toggleCheck(habitId: $habitId, date: $date)
  }
`;

export const TOGGLE_SKIP = gql`
  mutation ToggleSkip($habitId: String!, $date: String!) {
    toggleSkip(habitId: $habitId, date: $date)
  }
`;

export const LOG_SLIP = gql`
  mutation LogSlip($habitId: String!, $date: String!) {
    logSlip(habitId: $habitId, date: $date)
  }
`;

export const UNDO_SLIP = gql`
  mutation UndoSlip($habitId: String!, $date: String!) {
    undoSlip(habitId: $habitId, date: $date)
  }
`;

export const COMPLETE_RETRO = gql`
  mutation CompleteRetro($sprintId: String!, $decisions: [RetroDecisionInput!]!, $retroNotes: String) {
    completeRetro(sprintId: $sprintId, decisions: $decisions, retroNotes: $retroNotes)
  }
`;
