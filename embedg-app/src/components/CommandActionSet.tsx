import { useShallow } from "zustand/react/shallow";
import CommandAction from "./CommandAction";
import Collapsable from "./Collapsable";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import { usePremiumGuildFeatures } from "../util/premium";
import LimitButton from "./LimitButton";
import { useCommandActionsStore } from "../state/actions";

interface Props {
  cmdId: string;
}

export default function ActionSet({ cmdId }: Props) {
  const features = usePremiumGuildFeatures();
  const maxActions = features?.max_actions_per_component || 0;

  const actions = useCommandActionsStore(
    useShallow((state) => state.actions[cmdId]?.actions.map((a) => a.id) || []),
  );

  const [addAction, clearActions] = useCommandActionsStore(
    useShallow((state) => [state.addAction, state.clearActions]),
  );

  function add() {
    addAction(cmdId, {
      id: getUniqueId(),
      type: 1,
      text: "",
      public: false,
      allow_role_mentions: false,
    });
  }

  return (
    <Collapsable
      id={`actions.${cmdId}`}
      validationPathPrefix={`actions.${cmdId}`}
      title="Actions"
      extra={
        <div className="text-sm italic font-light text-mist-400">
          {actions.length} / {maxActions}
        </div>
      }
    >
      <AutoAnimate className="space-y-2">
        {actions.map((id, i) => (
          <CommandAction cmdId={cmdId} actionIndex={i} key={id} />
        ))}
      </AutoAnimate>
      <div className="flex flex-wrap gap-3 mt-3 text-sm">
        <LimitButton
          limit="max_actions_per_component"
          features={features}
          count={actions.length}
          className="bg-azure-500 px-3 py-2 rounded-lg transition-colors hover:bg-azure-400 text-white whitespace-nowrap"
          onClick={add}
        >
          Add Action
        </LimitButton>
        <button
          className="px-3 py-2 rounded-lg border-2 border-red/70 hover:bg-red hover:border-red transition-colors text-white whitespace-nowrap"
          onClick={() => clearActions(cmdId)}
        >
          Clear Actions
        </button>
      </div>
    </Collapsable>
  );
}
