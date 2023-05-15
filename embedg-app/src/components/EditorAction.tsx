import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import EditorInput from "./EditorInput";
import { RoleSelect } from "./RoleSelect";
import { useSendSettingsStore } from "../state/sendSettings";
import { usePremiumStatus } from "../util/premium";
import SavedMessageSelect from "./SavedMessageSelect";

interface Props {
  setId: string;
  actionIndex: number;
}

const actionTypes = {
  1: "Text Response",
  2: "Toggle Role",
  3: "Add Role",
  4: "Remove Role",
  5: "Saved Message Response",
} as const;

const actionDescriptions = {
  1: "Send a text response to the user.",
  2: "Toggle a role for the user.",
  3: "Add a role to the user.",
  4: "Remove a role from the user.",
  5: "Respond with a saved message.",
};

export default function EditorAction({ setId, actionIndex }: Props) {
  const maxActions = usePremiumStatus().benefits.maxActionsPerComponent;
  const selectedGuildId = useSendSettingsStore((state) => state.guildId);

  const action = useCurrentMessageStore(
    (state) => state.actions[setId]?.actions[actionIndex],
    shallow
  );

  const actionCount = useCurrentMessageStore(
    (state) => state.actions[setId]?.actions?.length || 0
  );

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveActionUp,
      state.moveActionDown,
      state.duplicateAction,
      state.deleteAction,
    ],
    shallow
  );

  const [setType, setText, setTargetId] = useCurrentMessageStore(
    (state) => [
      state.setActionType,
      state.setActionText,
      state.setActionTargetId,
    ],
    shallow
  );

  return (
    <div className="p-3 border-2 border-dark-6 rounded-md">
      <Collapsable
        id={`actions.${setId}.actions.${action.id}`}
        valiationPathPrefix={`actions.${setId}.actions.${actionIndex}`}
        title={`Action ${actionIndex + 1}`}
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {actionIndex > 0 && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveUp(setId, actionIndex)}
              />
            )}
            {actionIndex < actionCount - 1 && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveDown(setId, actionIndex)}
              />
            )}
            {actionCount < maxActions && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={() => duplicate(setId, actionIndex)}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={() => remove(setId, actionIndex)}
            />
          </div>
        }
        extra={
          <div className="text-gray-500 truncate flex space-x-2 pl-2">
            <div>-</div>
            <div className="truncate">{actionTypes[action.type]}</div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex space-x-3">
            <div className="flex-none">
              <div className="mb-1.5 flex">
                <div className="uppercase text-gray-300 text-sm font-medium">
                  Type
                </div>
              </div>
              <select
                className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer text-white"
                value={action.type.toString()}
                onChange={(v) =>
                  setType(setId, actionIndex, parseInt(v.target.value))
                }
              >
                {Object.entries(actionTypes).map(([key, value]) => (
                  <option value={key.toString()} key={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {action.type === 1 ? (
            <EditorInput
              label="Response"
              type="textarea"
              value={action.text}
              onChange={(v) => setText(setId, actionIndex, v)}
            />
          ) : action.type === 2 || action.type === 3 || action.type === 4 ? (
            <RoleSelect
              guildId={selectedGuildId}
              roleId={action.target_id || null}
              onChange={(v) => setTargetId(setId, actionIndex, v || "")}
            />
          ) : action.type === 5 ? (
            <SavedMessageSelect
              guildId={selectedGuildId}
              messageId={action.target_id || null}
              onChange={(v) => setTargetId(setId, actionIndex, v || "")}
            />
          ) : null}

          <div className="text-gray-500 text-sm">
            {actionDescriptions[action.type]}
          </div>
        </div>
      </Collapsable>
    </div>
  );
}
