import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import EditorComponentBaseSection from "./EditorComponentBaseSection";
import EditorComponentBaseContainer from "./EditorComponentBaseContainer";

interface Props {
  rootIndex: number;
  rootId: number;
}

export default function EditorComponentRootContainer({
  rootIndex,
  rootId,
}: Props) {
  const componentCount = useCurrentMessageStore(
    (state) => state.components.length
  );

  const container = useCurrentMessageStore(
    (state) => state.getContainer(rootIndex),
    shallow
  );
  const updateContainer = useCurrentMessageStore(
    (state) => state.updateContainer
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

  const [
    addSubComponent,
    clearSubComponents,
    moveSubComponentUp,
    moveSubComponentDown,
    deleteSubComponent,
    updateSubComponent,
    duplicateSubComponent,
  ] = useCurrentMessageStore(
    (state) => [
      state.addContainerComponent,
      state.clearContainerComponents,
      state.moveContainerComponentUp,
      state.moveContainerComponentDown,
      state.deleteContainerComponent,
      state.updateContainerComponent,
      state.duplicateContainerComponent,
    ],
    shallow
  );

  if (!container) {
    return null;
  }

  return (
    <EditorComponentBaseContainer
      id={`components.${rootId}`}
      validationPathPrefix={`components.${rootIndex}`}
      data={container}
      onChange={(data) => updateContainer(rootIndex, data)}
      duplicate={() => duplicate(rootIndex)}
      moveUp={rootIndex > 0 ? () => moveUp(rootIndex) : () => {}}
      moveDown={
        rootIndex < componentCount - 1 ? () => moveDown(rootIndex) : () => {}
      }
      remove={() => remove(rootIndex)}
      addSubComponent={(component) => addSubComponent(rootIndex, component)}
      clearSubComponents={() => clearSubComponents(rootIndex)}
      moveSubComponentUp={(index) => moveSubComponentUp(rootIndex, index)}
      moveSubComponentDown={(index) => moveSubComponentDown(rootIndex, index)}
      deleteSubComponent={(index) => deleteSubComponent(rootIndex, index)}
      duplicateSubComponent={(index) => duplicateSubComponent(rootIndex, index)}
      onSubComponentChange={(index, data) =>
        updateSubComponent(rootIndex, index, data)
      }
    />
  );
}
