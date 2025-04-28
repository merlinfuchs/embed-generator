import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import { getUniqueId } from "../util";
import EditorComponentBaseActionRow from "./EditorComponentBaseActionRow";

interface Props {
  rootIndex: number;
  rootId: number;
}

export default function EditorComponentActionRow({ rootIndex, rootId }: Props) {
  const componentCount = useCurrentMessageStore(
    (state) => state.components.length
  );
  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveComponentUp,
      state.moveComponentDown,
      state.duplicateActionRow,
      state.deleteComponent,
    ],
    shallow
  );

  const [addSubComponent, clearSubComponents] = useCurrentMessageStore(
    (state) => [state.addActionRowComponent, state.clearActionRowComponents],
    shallow
  );

  const [
    moveSubComponentUp,
    moveSubComponentDown,
    deleteSubComponent,
    updateActionRowButton,
    duplicateActionRowButton,
    updateActionRowSelectMenu,
    updateActionRowSelectMenuOption,
    addActionRowSelectMenuOption,
    duplicateActionRowSelectMenuOption,
    moveActionRowSelectMenuOptionUp,
    moveActionRowSelectMenuOptionDown,
    deleteActionRowSelectMenuOption,
    clearActionRowSelectMenuOptions,
  ] = useCurrentMessageStore(
    (state) => [
      state.moveActionRowComponentUp,
      state.moveActionRowComponentDown,
      state.deleteActionRowComponent,
      state.updateActionRowButton,
      state.duplicateActionRowButton,
      state.updateActionRowSelectMenu,
      state.updateActionRowSelectMenuOption,
      state.addActionRowSelectMenuOption,
      state.duplicateActionRowSelectMenuOption,
      state.moveActionRowSelectMenuOptionUp,
      state.moveActionRowSelectMenuOptionDown,
      state.deleteActionRowSelectMenuOption,
      state.clearActionRowSelectMenuOptions,
    ],
    shallow
  );

  const actionRow = useCurrentMessageStore(
    (state) => state.getActionRow(rootIndex),
    shallow
  );

  if (!actionRow) {
    return null;
  }

  return (
    <EditorComponentBaseActionRow
      id={`components.${rootId}`}
      validationPathPrefix={`components.${rootIndex}`}
      data={actionRow}
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
      onButtonChange={(index, data) =>
        updateActionRowButton(rootIndex, index, data)
      }
      duplicateButton={(index) => duplicateActionRowButton(rootIndex, index)}
      onSelectMenuChange={(index, data) =>
        updateActionRowSelectMenu(rootIndex, index, data)
      }
      onSelectMenuOptionChange={(index, optionIndex, data) =>
        updateActionRowSelectMenuOption(rootIndex, index, optionIndex, data)
      }
      addSelectMenuOption={(index) =>
        addActionRowSelectMenuOption(rootIndex, index, {
          id: getUniqueId(),
          label: "",
          action_set_id: getUniqueId().toString(),
        })
      }
      duplicateSelectMenuOption={(index) =>
        duplicateActionRowSelectMenuOption(rootIndex, index, 0)
      }
      moveSelectMenuOptionUp={(index) =>
        moveActionRowSelectMenuOptionUp(rootIndex, index, 0)
      }
      moveSelectMenuOptionDown={(index) =>
        moveActionRowSelectMenuOptionDown(rootIndex, index, 0)
      }
      removeSelectMenuOption={(index) =>
        deleteActionRowSelectMenuOption(rootIndex, index, 0)
      }
      clearSelectMenuOptions={(index) =>
        clearActionRowSelectMenuOptions(rootIndex, index)
      }
    />
  );
}
