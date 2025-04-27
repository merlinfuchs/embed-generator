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
import EditorComponentBaseTextDisplay from "./EditorComponentBaseTextDisplay";

interface Props {
  rootIndex: number;
  rootId: number;
}

export default function EditorComponentTextDisplay({
  rootIndex,
  rootId,
}: Props) {
  const componentCount = useCurrentMessageStore(
    (state) => state.components.length
  );

  const textDisplay = useCurrentMessageStore(
    (state) => state.getTextDisplay(rootIndex),
    shallow
  );
  const updateTextDisplay = useCurrentMessageStore(
    (state) => state.updateTextDisplay
  );

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveComponentUp,
      state.moveComponentDown,
      state.duplicateTextDisplay,
      state.deleteComponent,
    ],
    shallow
  );

  if (!textDisplay) {
    return null;
  }

  return (
    <EditorComponentBaseTextDisplay
      validationPathPrefix={`components.${rootIndex}`}
      title="Text Display"
      data={textDisplay}
      onChange={(data) => updateTextDisplay(rootIndex, data)}
      duplicate={componentCount < 5 ? () => duplicate(rootIndex) : undefined}
      moveUp={rootIndex > 0 ? () => moveUp(rootIndex) : undefined}
      moveDown={
        rootIndex < componentCount - 1 ? () => moveDown(rootIndex) : undefined
      }
      remove={() => remove(rootIndex)}
    />
  );
}
