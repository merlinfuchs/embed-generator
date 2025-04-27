import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";

interface Props {
  rootIndex: number;
  rootId: number;
  childIndex: number;
  childId: number;
}

export default function EditorComponentChildTextDisplay({
  rootIndex,
  rootId,
  childIndex,
  childId,
}: Props) {
  const rootCount = useCurrentMessageStore((state) => state.components.length);
  const root = useCurrentMessageStore((state) => state.components[rootIndex]);

  const child = useCurrentMessageStore(
    (state) => state.getSubComponent(rootIndex, childIndex),
    shallow
  );

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveSubComponentUp,
      state.moveSubComponentDown,
      state.duplicateSubComponent,
      state.deleteSubComponent,
    ],
    shallow
  );

  const setContent = useCurrentMessageStore(
    (state) => state.setSubComponentContent
  );

  if (!child || child.type !== 10) {
    return null;
  }

  return (
    <div className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 border-dark-5">
      <Collapsable
        id={`components.${rootId}`}
        validationPathPrefix={`components.${rootIndex}.components`}
        title="Text Display"
        size="large"
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {rootIndex > 0 && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveUp(rootIndex, childIndex)}
              />
            )}
            {rootIndex < rootCount - 1 && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveDown(rootIndex, childIndex)}
              />
            )}
            {rootCount < 10 && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={() => duplicate(rootIndex, childIndex)}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={() => remove(rootIndex, childIndex)}
            />
          </div>
        }
        extra={
          child.content ? (
            <div className="text-gray-500 truncate flex space-x-2 pl-1">
              <div>-</div>
              <div className="truncate">{child.content}</div>
            </div>
          ) : null
        }
      >
        <div className="space-y-4">
          <EditorInput
            type="textarea"
            label="Content"
            maxLength={4000}
            value={child.content}
            onChange={(v) => setContent(rootIndex, childIndex, v)}
            className="flex-auto"
            validationPath={`components.${rootIndex}.components.${childIndex}.content`}
          />
        </div>
      </Collapsable>
    </div>
  );
}
