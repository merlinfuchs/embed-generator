import { useShallow } from "zustand/react/shallow";
import { useCommandActionsStore } from "../state/actions";
import { useSendSettingsStore } from "../state/sendSettings";
import { usePremiumGuildFeatures } from "../util/premium";
import Action from "./Action";

interface Props {
  cmdId: string;
  actionIndex: number;
  /** The store the action set lives in, the one of custom commands unless given. */
  store?: typeof useCommandActionsStore;
  /** The action runs when a form is submitted, so it can't open a form or edit a message. */
  inForm?: boolean;
}

export default function EditorAction({
  cmdId,
  actionIndex,
  store,
  inForm,
}: Props) {
  const useStore = store ?? useCommandActionsStore;
  const features = usePremiumGuildFeatures();
  const maxActions = features?.max_actions_per_component || 0;
  const selectedGuildId = useSendSettingsStore((state) => state.guildId);

  const action = useStore(
    useShallow((state) => state.actions[cmdId]?.actions[actionIndex]),
  );

  const actionCount = useStore(
    (state) => state.actions[cmdId]?.actions?.length || 0,
  );

  const [moveUp, moveDown, duplicate, remove] = useStore(
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
    setChannelId,
    setMessage,
    setPublic,
    setAllowRoleMentions,
    setDisableDefaultResponse,
    setRoleIds,
    setPermissions,
  ] = useStore(
    useShallow((state) => [
      state.setActionType,
      state.setActionText,
      state.setActionTargetId,
      state.setActionChannelId,
      state.setActionMessage,
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
      inForm={inForm}
      moveUp={() => moveUp(cmdId, actionIndex)}
      moveDown={() => moveDown(cmdId, actionIndex)}
      duplicate={() => duplicate(cmdId, actionIndex)}
      remove={() => remove(cmdId, actionIndex)}
      setText={(text) => setText(cmdId, actionIndex, text)}
      setType={(type) => setType(cmdId, actionIndex, type)}
      setTargetId={(id) => setTargetId(cmdId, actionIndex, id)}
      setChannelId={(id) => setChannelId(cmdId, actionIndex, id)}
      setMessage={(message) => setMessage(cmdId, actionIndex, message)}
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
