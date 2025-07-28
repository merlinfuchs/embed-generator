import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
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
    (state) => state.updateComponent
  );

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveComponentUp,
      state.moveComponentDown,
      state.duplicateComponent,
      state.deleteComponent,
    ],
    shallow
  );

  if (!textDisplay) {
    return null;
  }

  return (
    <div className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow">
      <EditorComponentBaseTextDisplay
        id={`components.${rootId}`}
        validationPathPrefix={`components.${rootIndex}`}
        data={textDisplay}
        onChange={(data) => updateTextDisplay(rootIndex, data)}
        duplicate={componentCount < 5 ? () => duplicate(rootIndex) : undefined}
        moveUp={rootIndex > 0 ? () => moveUp(rootIndex) : undefined}
        moveDown={
          rootIndex < componentCount - 1 ? () => moveDown(rootIndex) : undefined
        }
        remove={() => remove(rootIndex)}
        size="large"
      />
    </div>
  );
}
