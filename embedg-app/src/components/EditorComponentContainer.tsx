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

    actionRowAddSubComponent,
    actionRowClearSubComponents,
    actionRowMoveSubComponentUp,
    actionRowMoveSubComponentDown,
    actionRowDeleteSubComponent,
    actionRowDuplicateSubComponent,
    actionRowOnSubComponentChange,
    actionRowAddSelectMenuOption,
    actionRowOnSelectMenuOptionChange,
    actionRowDuplicateSelectMenuOption,
    actionRowMoveSelectMenuOptionUp,
    actionRowMoveSelectMenuOptionDown,
    actionRowRemoveSelectMenuOption,
    actionRowClearSelectMenuOptions,

    sectionOnAccessoryChange,
    sectionAddSubComponent,
    sectionClearSubComponents,
    sectionMoveSubComponentUp,
    sectionMoveSubComponentDown,
    sectionDeleteSubComponent,
    sectionOnSubComponentChange,
    sectionDuplicateSubComponent,

    mediaGalleryAddItem,
    mediaGalleryClearItems,
    mediaGalleryMoveItemUp,
    mediaGalleryMoveItemDown,
    mediaGalleryDeleteItem,
    mediaGalleryOnItemChange,
    mediaGalleryDuplicateItem,
  ] = useCurrentMessageStore(
    (state) => [
      state.addContainerComponent,
      state.clearContainerComponents,
      state.moveContainerComponentUp,
      state.moveContainerComponentDown,
      state.deleteContainerComponent,
      state.updateContainerComponent,
      state.duplicateContainerComponent,

      state.addContainerActionRowComponent,
      state.clearContainerRowActionComponents,
      state.moveContainerActionRowComponentUp,
      state.moveContainerActionRowComponentDown,
      state.deleteContainerActionRowComponent,
      state.duplicateContainerActionRowComponent,
      state.updateContainerActionRowComponent,
      state.addContainerActionRowSelectMenuOption,
      state.updateContainerActionRowSelectMenuOption,
      state.duplicateContainerActionRowSelectMenuOption,
      state.moveContainerActionRowSelectMenuOptionUp,
      state.moveContainerActionRowSelectMenuOptionDown,
      state.removeContainerActionRowSelectMenuOption,
      state.clearContainerActionRowSelectMenuOptions,

      state.updateContainerSectionAccessory,
      state.addContainerSectionComponent,
      state.clearContainerSectionComponents,
      state.moveContainerSectionComponentUp,
      state.moveContainerSectionComponentDown,
      state.deleteContainerSectionComponent,
      state.updateContainerSectionComponent,
      state.duplicateContainerSectionComponent,

      state.addContainerMediaGalleryItem,
      state.clearContainerMediaGalleryItems,
      state.moveContainerMediaGalleryItemUp,
      state.moveContainerMediaGalleryItemDown,
      state.deleteContainerMediaGalleryItem,
      state.updateContainerMediaGalleryItem,
      state.duplicateContainerMediaGalleryItem,
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
      actionRowAddSubComponent={(a, k) =>
        actionRowAddSubComponent(rootIndex, a, k)
      }
      actionRowClearSubComponents={(a) =>
        actionRowClearSubComponents(rootIndex, a)
      }
      actionRowMoveSubComponentUp={(a, k) =>
        actionRowMoveSubComponentUp(rootIndex, a, k)
      }
      actionRowMoveSubComponentDown={(a, k) =>
        actionRowMoveSubComponentDown(rootIndex, a, k)
      }
      actionRowDeleteSubComponent={(a, k) =>
        actionRowDeleteSubComponent(rootIndex, a, k)
      }
      actionRowDuplicateSubComponent={(a, k) =>
        actionRowDuplicateSubComponent(rootIndex, a, k)
      }
      actionRowOnSubComponentChange={(a, k, data) =>
        actionRowOnSubComponentChange(rootIndex, a, k, data)
      }
      actionRowAddSelectMenuOption={(a, k) =>
        actionRowAddSelectMenuOption(rootIndex, a, k)
      }
      actionRowOnSelectMenuOptionChange={(
        index,
        childIndex,
        optionIndex,
        data
      ) =>
        actionRowOnSelectMenuOptionChange(
          rootIndex,
          index,
          childIndex,
          optionIndex,
          data
        )
      }
      actionRowDuplicateSelectMenuOption={(a, k, o) =>
        actionRowDuplicateSelectMenuOption(rootIndex, a, k, o)
      }
      actionRowMoveSelectMenuOptionUp={(a, k, o) =>
        actionRowMoveSelectMenuOptionUp(rootIndex, a, k, o)
      }
      actionRowMoveSelectMenuOptionDown={(a, k, o) =>
        actionRowMoveSelectMenuOptionDown(rootIndex, a, k, o)
      }
      actionRowRemoveSelectMenuOption={(a, k, o) =>
        actionRowRemoveSelectMenuOption(rootIndex, a, k, o)
      }
      actionRowClearSelectMenuOptions={(a, k) =>
        actionRowClearSelectMenuOptions(rootIndex, a, k)
      }
      sectionOnAccessoryChange={(i, data) =>
        sectionOnAccessoryChange(rootIndex, i, data)
      }
      sectionAddSubComponent={(s, component) =>
        sectionAddSubComponent(rootIndex, s, component)
      }
      sectionClearSubComponents={(s) => sectionClearSubComponents(rootIndex, s)}
      sectionMoveSubComponentUp={(s, k) =>
        sectionMoveSubComponentUp(rootIndex, s, k)
      }
      sectionMoveSubComponentDown={(s, k) =>
        sectionMoveSubComponentDown(rootIndex, s, k)
      }
      sectionDeleteSubComponent={(s, k) =>
        sectionDeleteSubComponent(rootIndex, s, k)
      }
      sectionOnSubComponentChange={(s, k, data) =>
        sectionOnSubComponentChange(rootIndex, s, k, data)
      }
      sectionDuplicateSubComponent={(s, k) =>
        sectionDuplicateSubComponent(rootIndex, s, k)
      }
      mediaGalleryAddItem={(a, component) =>
        mediaGalleryAddItem(rootIndex, a, component)
      }
      mediaGalleryClearItems={(a) => mediaGalleryClearItems(rootIndex, a)}
      mediaGalleryMoveItemUp={(a, i) => mediaGalleryMoveItemUp(rootIndex, a, i)}
      mediaGalleryMoveItemDown={(a, i) =>
        mediaGalleryMoveItemDown(rootIndex, a, i)
      }
      mediaGalleryDeleteItem={(a, i) => mediaGalleryDeleteItem(rootIndex, a, i)}
      mediaGalleryOnItemChange={(a, i, data) =>
        mediaGalleryOnItemChange(rootIndex, a, i, data)
      }
      mediaGalleryDuplicateItem={(a, i) =>
        mediaGalleryDuplicateItem(rootIndex, a, i)
      }
    />
  );
}
