import { useShallow } from "zustand/react/shallow";
import { useCommandActionsStore } from "../state/actions";
import { useSendSettingsStore } from "../state/sendSettings";
import { usePremiumGuildFeatures } from "../util/premium";
import Action from "./Action";

interface Props {
  cmdId: string;
  actionIndex: number;
}

export default function EditorAction({ cmdId, actionIndex }: Props) {
  const features = usePremiumGuildFeatures();
  const maxActions = features?.max_actions_per_component || 0;
  const selectedGuildId = useSendSettingsStore((state) => state.guildId);

  const action = useCommandActionsStore(
    useShallow((state) => state.actions[cmdId]?.actions[actionIndex]),
  );

  const actionCount = useCommandActionsStore(
    (state) => state.actions[cmdId]?.actions?.length || 0,
  );

  const [moveUp, moveDown, duplicate, remove] = useCommandActionsStore(
    useShallow((state) => [
      state.moveActionUp,
      state.moveActionDown,
      state.duplicateAction,
      state.deleteAction,
    ]),
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
    useShallow((state) => [
      state.setActionType,
      state.setActionText,
      state.setActionTargetId,
      state.setActionPublic,
      state.setActionAllowRoleMentions,
      state.setActionDisableDefaultResponse,
      state.setActionRoleIds,
      state.setActionPermissions,
    ]),
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
