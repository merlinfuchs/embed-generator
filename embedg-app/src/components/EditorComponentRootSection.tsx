import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import EditorComponentChild from "./EditorComponentChild";

interface Props {
  rootIndex: number;
  rootId: number;
}

export default function EditorComponentRootSection({
  rootIndex,
  rootId,
}: Props) {
  const rootCount = useCurrentMessageStore((state) => state.components.length);
  const children = useCurrentMessageStore(
    (state) => state.getSubComponents(rootIndex).map((c) => c.id) || [],
    shallow
  );
  const isButtonRow = useCurrentMessageStore((state) =>
    state.getSubComponents(rootIndex).every((c) => c.type === 2)
  );
  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveRootComponentUp,
      state.moveRootComponentDown,
      state.duplicateRootComponent,
      state.deleteRootComponent,
    ],
    shallow
  );

  const [addSubComponent, clearSubComponents] = useCurrentMessageStore(
    (state) => [state.addSubComponent, state.clearSubComponents],
    shallow
  );

  return (
    <div className="bg-dark-3 p-3 rounded-md">
      <Collapsable
        id={`components.${rootId}`}
        valiationPathPrefix={`components.${rootIndex}.components`}
        title="Section"
        size="large"
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {rootIndex > 0 && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveUp(rootIndex)}
              />
            )}
            {rootIndex < rootCount - 1 && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveDown(rootIndex)}
              />
            )}
            {rootCount < 10 && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={() => duplicate(rootIndex)}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={() => remove(rootIndex)}
            />
          </div>
        }
      >
        <AutoAnimate>
          {children.map((id, i) => (
            <EditorComponentChild
              key={id}
              rootIndex={rootIndex}
              rootId={rootId}
              childIndex={i}
              childId={id}
            />
          ))}
          <div>
            <div className="space-x-3 mt-3">
              {children.length < 5 ? (
                <button
                  className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white"
                  onClick={() =>
                    addSubComponent(rootIndex, {
                      id: getUniqueId(),
                      type: 10,
                      content: "",
                    })
                  }
                >
                  Add Text
                </button>
              ) : (
                <button
                  disabled
                  className="bg-dark-2 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-300"
                >
                  Add Text
                </button>
              )}
              <button
                className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
                onClick={() => clearSubComponents(rootIndex)}
              >
                Clear Components
              </button>
            </div>
          </div>
        </AutoAnimate>
      </Collapsable>
    </div>
  );
}
