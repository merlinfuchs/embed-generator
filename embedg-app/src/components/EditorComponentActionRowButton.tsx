import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import EditorComponentBaseButton from "./EditorComponentBaseButton";

interface Props {
  rootIndex: number;
  rootId: number;
  childIndex: number;
  childId: number;
}

export default function EditorComponentActionRowButton({
  rootIndex,
  rootId,
  childIndex,
  childId,
}: Props) {
  const buttonCount = useCurrentMessageStore(
    (state) => state.getActionRow(rootIndex)?.components.length || 0
  );

  const button = useCurrentMessageStore(
    (state) => state.getActionRowButton(rootIndex, childIndex),
    shallow
  );

  const updateButton = useCurrentMessageStore(
    (state) => state.updateActionRowComponent,
    shallow
  );

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveActionRowComponentUp,
      state.moveActionRowComponentDown,
      state.duplicateActionRowComponent,
      state.deleteActionRowComponent,
    ],
    shallow
  );

  if (!button) {
    // This is not a button (shouldn't happen)
    return <div></div>;
  }

  return (
    <EditorComponentBaseButton
      id={`components.${rootId}.components.${childId}`}
      validationPathPrefix={`components.${rootIndex}.components.${childIndex}`}
      title={`Button ${childIndex + 1}`}
      data={button}
      onChange={(data) => updateButton(rootIndex, childIndex, data)}
      duplicate={
        buttonCount < 5 ? () => duplicate(rootIndex, childIndex) : undefined
      }
      moveUp={childIndex > 0 ? () => moveUp(rootIndex, childIndex) : undefined}
      moveDown={
        childIndex < buttonCount - 1
          ? () => moveDown(rootIndex, childIndex)
          : undefined
      }
      remove={() => remove(rootIndex, childIndex)}
    />
  );
}
