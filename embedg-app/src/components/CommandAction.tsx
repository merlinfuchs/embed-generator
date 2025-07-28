import { shallow } from "zustand/shallow";
import { useCommandActionsStore } from "../state/actions";
import { useSendSettingsStore } from "../state/sendSettings";
import { usePremiumGuildFeatures } from "../util/premium";
import Action from "./Action";

interface Props {
  cmdId: string;
  actionIndex: number;
}

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
} as const;

const actionDescriptions = {
  1: "Respond with a text message to the channel.",
  2: "Toggle a role for the user.",
  3: "Add a role to the user.",
  4: "Remove a role from the user.",
  5: "Respond with a saved message to the channel.",
  6: "Send a text message to the user via DM.",
  7: "Send a saved message to the user via DM.",
  8: "Edit the message with a new text message.",
  9: "Edit the message with a saved message.",
} as const;

export default function EditorAction({ cmdId, actionIndex }: Props) {
  const features = usePremiumGuildFeatures();
  const maxActions = features?.max_actions_per_component || 0;
  const selectedGuildId = useSendSettingsStore((state) => state.guildId);

  const action = useCommandActionsStore(
    (state) => state.actions[cmdId]?.actions[actionIndex],
    shallow
  );

  const actionCount = useCommandActionsStore(
    (state) => state.actions[cmdId]?.actions?.length || 0
  );

  const [moveUp, moveDown, duplicate, remove] = useCommandActionsStore(
    (state) => [
      state.moveActionUp,
      state.moveActionDown,
      state.duplicateAction,
      state.deleteAction,
    ],
    shallow
  );

  const [
    setType,
    setText,
    setTargetId,
    setPublic,
    setAllowRoleMentions,
    setDisableDefaultResponse,
    setRoleIds,
    setPermissions,
  ] = useCommandActionsStore(
    (state) => [
      state.setActionType,
      state.setActionText,
      state.setActionTargetId,
      state.setActionPublic,
      state.setActionAllowRoleMentions,
      state.setActionDisableDefaultResponse,
      state.setActionRoleIds,
      state.setActionPermissions,
    ],
    shallow
  );

  return (
    <Action
      guildId={selectedGuildId}
      actionCount={actionCount}
      maxActions={maxActions}
      actionIndex={actionIndex}
      action={action}
      collapsableId={`actions.${cmdId}.actions.${action.id}`}
      moveUp={() => moveUp(cmdId, actionIndex)}
      moveDown={() => moveDown(cmdId, actionIndex)}
      duplicate={() => duplicate(cmdId, actionIndex)}
      remove={() => remove(cmdId, actionIndex)}
      setText={(text) => setText(cmdId, actionIndex, text)}
      setType={(type) => setType(cmdId, actionIndex, type)}
      setTargetId={(id) => setTargetId(cmdId, actionIndex, id)}
      setPublic={(public_) => setPublic(cmdId, actionIndex, public_)}
      setAllowRoleMentions={(allow) =>
        setAllowRoleMentions(cmdId, actionIndex, allow)
      }
      setDisableDefaultResponse={(disable) =>
        setDisableDefaultResponse(cmdId, actionIndex, disable)
      }
      setRoleIds={(roleIds) => setRoleIds(cmdId, actionIndex, roleIds)}
      setPermissions={(permissions) =>
        setPermissions(cmdId, actionIndex, permissions)
      }
    />
  );
}
