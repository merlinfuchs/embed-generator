import { useDocumentStore } from "../state/document";
import { useSendSettingsStore } from "../state/sendSettings";
import { usePremiumGuildFeatures } from "../util/premium";
import Action from "./Action";

interface Props {
  setId: string;
  actionIndex: number;
}

const _actionTypes = {
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

const _actionDescriptions = {
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

export default function EditorAction({ setId, actionIndex }: Props) {
  const features = usePremiumGuildFeatures();
  const maxActions = features?.max_actions_per_component || 0;
  const selectedGuildId = useSendSettingsStore((state) => state.guildId);

  const action = useDocumentStore(
    (state) => state.actions[setId]?.actions[actionIndex],
  );

  const actionCount = useDocumentStore(
    (state) => state.actions[setId]?.actions?.length || 0,
  );

  const {
    moveActionUp,
    moveActionDown,
    duplicateAction,
    deleteAction,
    setActionType,
    setActionText,
    setActionTargetId,
    setActionPublic,
    setActionAllowRoleMentions,
    setActionDisableDefaultResponse,
    setActionRoleIds,
    setActionPermissions,
  } = useDocumentStore.getState();

  return (
    <Action
      guildId={selectedGuildId}
      actionCount={actionCount}
      maxActions={maxActions}
      actionIndex={actionIndex}
      action={action}
      collapsableId={`actions.${setId}.actions.${action.id}`}
      valiationPathPrefix={`actions.${setId}.actions.${actionIndex}`}
      moveUp={() => moveActionUp(setId, actionIndex)}
      moveDown={() => moveActionDown(setId, actionIndex)}
      duplicate={() => duplicateAction(setId, actionIndex)}
      remove={() => deleteAction(setId, actionIndex)}
      setText={(text) => setActionText(setId, actionIndex, text)}
      setType={(type) => setActionType(setId, actionIndex, type)}
      setTargetId={(id) => setActionTargetId(setId, actionIndex, id)}
      setPublic={(public_) => setActionPublic(setId, actionIndex, public_)}
      setAllowRoleMentions={(allow) =>
        setActionAllowRoleMentions(setId, actionIndex, allow)
      }
      setDisableDefaultResponse={(disable) =>
        setActionDisableDefaultResponse(setId, actionIndex, disable)
      }
      setRoleIds={(ids) => setActionRoleIds(setId, actionIndex, ids)}
      setPermissions={(perms) =>
        setActionPermissions(setId, actionIndex, perms)
      }
    />
  );
}
