import { useDocumentStore } from "../state/document";
import { useSendSettingsStore } from "../state/sendSettings";
import { usePremiumGuildFeatures } from "../util/premium";
import Action from "./Action";

interface Props {
  setId: string;
  actionIndex: number;
}

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
