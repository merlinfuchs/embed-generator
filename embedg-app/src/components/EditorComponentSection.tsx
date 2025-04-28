import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import EditorComponentBaseSection from "./EditorComponentBaseSection";

interface Props {
  rootIndex: number;
  rootId: number;
}

export default function EditorComponentRootSection({
  rootIndex,
  rootId,
}: Props) {
  const componentCount = useCurrentMessageStore(
    (state) => state.components.length
  );

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveComponentUp,
      state.moveComponentDown,
      state.duplicateSection,
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
    updateTextDisplay,
    duplicateTextDisplay,
  ] = useCurrentMessageStore(
    (state) => [
      state.addSectionComponent,
      state.clearSectionComponents,
      state.moveSectionComponentUp,
      state.moveSectionComponentDown,
      state.deleteSectionComponent,
      state.updateSectionTextDisplay,
      state.duplicateSectionTextDisplay,
    ],
    shallow
  );

  const section = useCurrentMessageStore(
    (state) => state.components[rootIndex],
    shallow
  );

  if (!section || section.type !== 9) {
    return null;
  }

  return (
    <EditorComponentBaseSection
      id={`components.${rootId}`}
      validationPathPrefix={`components.${rootIndex}`}
      data={section}
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
      onTextDisplayChange={(index, data) =>
        updateTextDisplay(rootIndex, index, data)
      }
      duplicateTextDisplay={(index) => duplicateTextDisplay(rootIndex, index)}
    />
  );
}
