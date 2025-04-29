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

  const section = useCurrentMessageStore(
    (state) => state.getSection(rootIndex),
    shallow
  );
  const updateSection = useCurrentMessageStore((state) => state.updateSection);

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
    updateSectionAccessory,
    addSubComponent,
    clearSubComponents,
    moveSubComponentUp,
    moveSubComponentDown,
    deleteSubComponent,
    updateSubComponent,
    duplicateSubComponent,
  ] = useCurrentMessageStore(
    (state) => [
      state.updateSectionAccessory,
      state.addSectionComponent,
      state.clearSectionComponents,
      state.moveSectionComponentUp,
      state.moveSectionComponentDown,
      state.deleteSectionComponent,
      state.updateSectionComponent,
      state.duplicateSectionComponent,
    ],
    shallow
  );

  if (!section) {
    return null;
  }

  return (
    <div className="bg-dark-3 p-3 rounded-md">
      <EditorComponentBaseSection
        id={`components.${rootId}`}
        validationPathPrefix={`components.${rootIndex}`}
        size="large"
        data={section}
        onChange={(data) => updateSection(rootIndex, data)}
        duplicate={() => duplicate(rootIndex)}
        moveUp={rootIndex > 0 ? () => moveUp(rootIndex) : () => {}}
        moveDown={
          rootIndex < componentCount - 1 ? () => moveDown(rootIndex) : () => {}
        }
        remove={() => remove(rootIndex)}
        onAccessoryChange={(data) => updateSectionAccessory(rootIndex, data)}
        addSubComponent={(component) => addSubComponent(rootIndex, component)}
        clearSubComponents={() => clearSubComponents(rootIndex)}
        moveSubComponentUp={(index) => moveSubComponentUp(rootIndex, index)}
        moveSubComponentDown={(index) => moveSubComponentDown(rootIndex, index)}
        deleteSubComponent={(index) => deleteSubComponent(rootIndex, index)}
        onSubComponentChange={(index, data) =>
          updateSubComponent(rootIndex, index, data)
        }
        duplicateSubComponent={(index) =>
          duplicateSubComponent(rootIndex, index)
        }
      />
    </div>
  );
}
