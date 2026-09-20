import { useDocumentStore } from "../state/document";
import EditorAction from "./EditorAction";
import Collapsable from "./Collapsable";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import { usePremiumGuildFeatures } from "../util/premium";

interface Props {
  setId: string;
}

export default function EditorActionSet({ setId }: Props) {
  const features = usePremiumGuildFeatures();
  const maxActions = features?.max_actions_per_component || 0;

  const actions = useDocumentStore((state) => state.actions[setId]?.actions);

  const { addAction, clearActions } = useDocumentStore.getState();

  function add() {
    addAction(setId, {
      id: getUniqueId(),
      type: 1,
      text: "",
      public: false,
      allow_role_mentions: false,
    });
  }

  return (
    <Collapsable
      id={`actions.${setId}`}
      validationPathPrefix={`actions.${setId}`}
      title="Actions"
      extra={
        <div className="text-sm italic font-light text-mist-400">
          {actions?.length ?? 0} / {maxActions}
        </div>
      }
    >
      <AutoAnimate className="space-y-2">
        {(actions ?? []).map((action, i) => (
          <EditorAction setId={setId} actionIndex={i} key={action.id} />
        ))}
      </AutoAnimate>
      <div className="space-x-3 mt-3 text-sm">
        {(actions?.length ?? 0) < maxActions ? (
          <button
            className="bg-azure-500 px-3 py-2 rounded-lg transition-colors hover:bg-azure-400 text-white"
            onClick={add}
          >
            Add Action
          </button>
        ) : (
          <button
            disabled
            className="bg-ink-900 px-3 py-2 rounded-lg transition-colors cursor-not-allowed text-mist-300"
          >
            Add Action
          </button>
        )}
        <button
          className="px-3 py-2 rounded-lg border-2 border-red/70 hover:bg-red hover:border-red transition-colors text-white"
          onClick={() => clearActions(setId)}
        >
          Clear Actions
        </button>
      </div>
    </Collapsable>
  );
}
