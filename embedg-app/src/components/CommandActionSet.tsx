import { SparklesIcon } from "@heroicons/react/24/solid";
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
  /** The store the action set lives in, the one of custom commands unless given. */
  store?: typeof useCommandActionsStore;
  /** The actions run when a form is submitted, so they can't open a form or edit a message. */
  inForm?: boolean;
  /** The answers of the form as a message, offered as an action that posts them to a channel. */
  answersText?: string;
}

export default function ActionSet({
  cmdId,
  store,
  inForm,
  answersText,
}: Props) {
  const useStore = store ?? useCommandActionsStore;
  const features = usePremiumGuildFeatures();
  const maxActions = features?.max_actions_per_component || 0;
  // Shown either way, so a free server sees where answers can go before building the form.
  const advancedLocked = !!features && !features.advanced_action_types;

  const actions = useStore(
    useShallow((state) => state.actions[cmdId]?.actions.map((a) => a.id) || []),
  );

  const [addAction, clearActions] = useStore(
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

  function addPostAnswers(text: string) {
    addAction(cmdId, {
      id: getUniqueId(),
      type: 11,
      channel_id: "",
      text,
      allow_role_mentions: false,
      disable_default_response: false,
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
          <CommandAction
            cmdId={cmdId}
            actionIndex={i}
            key={id}
            store={useStore}
            inForm={inForm}
          />
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
        {answersText !== undefined && (
          <LimitButton
            limit="max_actions_per_component"
            features={features}
            count={actions.length}
            className={
              advancedLocked
                ? "px-3 py-2 rounded-lg border-2 border-amber-400/40 text-amber-300 hover:bg-amber-400/10 hover:border-amber-400/70 transition-colors inline-flex items-center space-x-2 text-left"
                : "px-3 py-2 rounded-lg border-2 border-white/15 hover:bg-white/5 hover:border-white/30 transition-colors text-white text-left"
            }
            onClick={() => addPostAnswers(answersText)}
          >
            {/* At the limit the button shows its own icon. */}
            {advancedLocked && actions.length < maxActions && (
              <SparklesIcon className="h-4 w-4 flex-none" />
            )}
            <span>
              Post Answers to a Channel{advancedLocked ? " (Premium)" : ""}
            </span>
          </LimitButton>
        )}
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
