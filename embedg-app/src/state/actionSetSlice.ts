import type { MessageAction, MessageActionSet } from "../discord/schema";
import { getUniqueId } from "../util";

/** The state an action set slice needs; both stores that mount it have it. */
export interface ActionSetState {
  actions: Record<string, MessageActionSet>;
}

export interface ActionSetActions {
  setActionSet: (id: string, actionSet: MessageActionSet) => void;
  addAction: (id: string, action: MessageAction) => void;
  clearActions: (id: string) => void;
  deleteAction: (id: string, i: number) => void;
  moveActionUp: (id: string, i: number) => void;
  moveActionDown: (id: string, i: number) => void;
  duplicateAction: (id: string, i: number) => void;
  setActionType: (id: string, i: number, type: number) => void;
  setActionText: (id: string, i: number, text: string) => void;
  setActionTargetId: (id: string, i: number, target: string) => void;
  setActionPublic: (id: string, i: number, val: boolean) => void;
  setActionAllowRoleMentions: (id: string, i: number, val: boolean) => void;
  setActionDisableDefaultResponse: (
    id: string,
    i: number,
    val: boolean,
  ) => void;
  setActionPermissions: (id: string, i: number, val: string) => void;
  setActionRoleIds: (id: string, i: number, val: string[]) => void;
}

/** The fields that come with an action type, beyond `type` and `id`. */
function defaultsForType(type: number): Omit<MessageAction, "type" | "id"> {
  if (type === 10) {
    return {
      permissions: "0",
      role_ids: [],
      disable_default_response: false,
    } as Omit<MessageAction, "type" | "id">;
  }

  const base = { public: false, allow_role_mentions: false };

  if (type === 1 || type === 6 || type === 8) {
    return { ...base, text: "" } as Omit<MessageAction, "type" | "id">;
  }
  if (type === 5 || type === 7 || type === 9) {
    return { ...base, target_id: "" } as Omit<MessageAction, "type" | "id">;
  }

  return {
    ...base,
    target_id: "",
    disable_default_response: false,
  } as Omit<MessageAction, "type" | "id">;
}

/**
 * The action set reducers, shared by the document store (message action sets)
 * and the command actions store. Both keep their sets in `state.actions`.
 */
export function createActionSetSlice<T extends ActionSetState>(
  set: (updater: (state: T) => void) => void,
): ActionSetActions {
  /** Runs `fn` against an existing action set. */
  const withSet = (id: string, fn: (actionSet: MessageActionSet) => void) =>
    set((state) => {
      const actionSet = state.actions[id];
      if (actionSet) fn(actionSet);
    });

  /** Runs `fn` against an existing action. */
  const withAction = (
    id: string,
    i: number,
    fn: (action: MessageAction, actionSet: MessageActionSet) => void,
  ) =>
    withSet(id, (actionSet) => {
      const action = actionSet.actions[i];
      if (action) fn(action, actionSet);
    });

  return {
    setActionSet: (id, actionSet) =>
      set((state) => {
        state.actions[id] = actionSet;
      }),

    addAction: (id, action) =>
      set((state) => {
        const actionSet = state.actions[id];
        if (actionSet) {
          actionSet.actions.push(action);
        } else {
          state.actions[id] = { actions: [action] };
        }
      }),

    clearActions: (id) =>
      withSet(id, (actionSet) => {
        actionSet.actions = [];
      }),

    deleteAction: (id, i) =>
      withSet(id, (actionSet) => {
        actionSet.actions.splice(i, 1);
      }),

    moveActionUp: (id, i) =>
      withAction(id, i, (action, actionSet) => {
        actionSet.actions.splice(i, 1);
        actionSet.actions.splice(i - 1, 0, action);
      }),

    moveActionDown: (id, i) =>
      withAction(id, i, (action, actionSet) => {
        actionSet.actions.splice(i, 1);
        actionSet.actions.splice(i + 1, 0, action);
      }),

    duplicateAction: (id, i) =>
      withAction(id, i, (action, actionSet) => {
        actionSet.actions.splice(i + 1, 0, { ...action, id: getUniqueId() });
      }),

    setActionType: (id, i, type) =>
      withAction(id, i, (action, actionSet) => {
        actionSet.actions[i] = {
          type,
          id: action.id,
          ...defaultsForType(type),
        } as MessageAction;
      }),

    // The schema is a union of action shapes, so each field is set where the
    // shape actually carries it.
    setActionText: (id, i, text) =>
      withAction(id, i, (action) => {
        if ("text" in action) action.text = text;
      }),

    setActionTargetId: (id, i, target) =>
      withAction(id, i, (action) => {
        if ("target_id" in action) action.target_id = target;
      }),

    setActionPublic: (id, i, val) =>
      withAction(id, i, (action) => {
        if ("public" in action) action.public = val;
      }),

    setActionAllowRoleMentions: (id, i, val) =>
      withAction(id, i, (action) => {
        if ("allow_role_mentions" in action) action.allow_role_mentions = val;
      }),

    setActionDisableDefaultResponse: (id, i, val) =>
      withAction(id, i, (action) => {
        if ("disable_default_response" in action) {
          action.disable_default_response = val;
        }
      }),

    setActionPermissions: (id, i, val) =>
      withAction(id, i, (action) => {
        if (action.type === 10) action.permissions = val;
      }),

    setActionRoleIds: (id, i, val) =>
      withAction(id, i, (action) => {
        if (action.type === 10) action.role_ids = val;
      }),
  };
}
