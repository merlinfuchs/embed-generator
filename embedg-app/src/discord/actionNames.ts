import type { MessageAction } from "./schema";

const actionTypes = {
  1: "Text Response",
  6: "Text DM",
  8: "Text Message Edit",
  5: "Saved Message Response",
  7: "Saved Message DM",
  9: "Saved Message Edit",
  2: "Toggle Role",
  3: "Add Role",
  4: "Remove Role",
  10: "Check Permissions",
  11: "Text Message to Channel",
  12: "Saved Message to Channel",
  13: "Show Form",
  14: "Send Answers to URL",
} as const;

/** The names of the response types when they carry a message of their own. */
const messageActionTypes = {
  5: "Message Response",
  7: "Message DM",
  9: "Message Edit",
  12: "Message to Channel",
} as const;

/** The name the editor shows for an action. */
export function actionName(action: MessageAction): string {
  return "message" in action
    ? messageActionTypes[action.type]
    : actionTypes[action.type];
}
