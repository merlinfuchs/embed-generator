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
      state.duplicateComponent,
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
    updateActionRowComponent,
    duplicateActionRowComponent,
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
      state.updateActionRowComponent,
      state.duplicateActionRowComponent,
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
    <div className="bg-dark-3 p-3 rounded-md">
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
        onSubComponentChange={(index, data) =>
          updateActionRowComponent(rootIndex, index, data)
        }
        duplicateSubComponent={(index) =>
          duplicateActionRowComponent(rootIndex, index)
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
        duplicateSelectMenuOption={(index, optionIndex) =>
          duplicateActionRowSelectMenuOption(rootIndex, index, optionIndex)
        }
        moveSelectMenuOptionUp={(index, optionIndex) =>
          moveActionRowSelectMenuOptionUp(rootIndex, index, optionIndex)
        }
        moveSelectMenuOptionDown={(index, optionIndex) =>
          moveActionRowSelectMenuOptionDown(rootIndex, index, optionIndex)
        }
        removeSelectMenuOption={(index, optionIndex) =>
          deleteActionRowSelectMenuOption(rootIndex, index, optionIndex)
        }
        clearSelectMenuOptions={(index) =>
          clearActionRowSelectMenuOptions(rootIndex, index)
        }
      />
    </div>
  );
}
