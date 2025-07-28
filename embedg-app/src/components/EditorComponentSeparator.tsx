import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import EditorComponentBaseSeparator from "./EditorComponentBaseSeparator";

interface Props {
  rootIndex: number;
  rootId: number;
}

export default function EditorComponentSeparator({ rootIndex, rootId }: Props) {
  const componentCount = useCurrentMessageStore(
    (state) => state.components.length
  );

  const separator = useCurrentMessageStore(
    (state) => state.getSeparator(rootIndex),
    shallow
  );
  const updateSeparator = useCurrentMessageStore(
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

  if (!separator) {
    return null;
  }

  return (
    <div className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow">
      <EditorComponentBaseSeparator
        id={`components.${rootId}`}
        validationPathPrefix={`components.${rootIndex}`}
        data={separator}
        onChange={(data) => updateSeparator(rootIndex, data)}
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
