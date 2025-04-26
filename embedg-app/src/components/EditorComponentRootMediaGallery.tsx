import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";

interface Props {
  rootIndex: number;
  rootId: number;
}

export default function EditorComponentRootMediaGallery({
  rootIndex,
  rootId,
}: Props) {
  const rootCount = useCurrentMessageStore((state) => state.components.length);
  const root = useCurrentMessageStore((state) => state.components[rootIndex]);

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveRootComponentUp,
      state.moveRootComponentDown,
      state.duplicateRootComponent,
      state.deleteRootComponent,
    ],
    shallow
  );

  if (!root || root.type !== 12) {
    return null;
  }

  return (
    <div className="bg-dark-3 p-3 rounded-md">
      <Collapsable
        id={`components.${rootId}`}
        valiationPathPrefix={`components.${rootIndex}`}
        title="Media Gallery"
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
        <div className="space-y-4"></div>
      </Collapsable>
    </div>
  );
}
