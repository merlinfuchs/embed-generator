import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import { getUniqueId } from "../util";
import EditorComponentBaseSelectMenu from "./EditorComponentBaseSelectMenu";

interface Props {
  rootIndex: number;
  rootId: number;
  childIndex: number;
  childId: number;
}

export default function EditorComponentActionRowSelectMenu({
  rootIndex,
  rootId,
  childIndex,
  childId,
}: Props) {
  const selectMenu = useCurrentMessageStore(
    (state) => state.getActionRowSelectMenu(rootIndex, childIndex),
    shallow
  );
  const updateActionRowComponent = useCurrentMessageStore(
    (state) => state.updateActionRowComponent
  );

  const [
    addOption,
    clearOptions,
    moveOptionUp,
    moveOptionDown,
    duplicateOption,
    removeOption,
    onOptionChange,
  ] = useCurrentMessageStore(
    (state) => [
      state.addActionRowSelectMenuOption,
      state.clearActionRowSelectMenuOptions,
      state.moveActionRowSelectMenuOptionUp,
      state.moveActionRowSelectMenuOptionDown,
      state.duplicateActionRowSelectMenuOption,
      state.deleteActionRowSelectMenuOption,
      state.updateActionRowSelectMenuOption,
    ],
    shallow
  );

  if (!selectMenu) {
    return <div></div>;
  }

  return (
    <EditorComponentBaseSelectMenu
      id={`components.${rootId}.components.${childId}`}
      validationPathPrefix={`components.${rootIndex}.components.${childIndex}`}
      data={selectMenu}
      onChange={(v) => updateActionRowComponent(rootIndex, childIndex, v)}
      addOption={() =>
        addOption(rootIndex, childIndex, {
          id: getUniqueId(),
          label: "",
          action_set_id: getUniqueId().toString(),
        })
      }
      clearOptions={() => clearOptions(rootIndex, childIndex)}
      moveOptionUp={() => moveOptionUp(rootIndex, childIndex, 0)}
      moveOptionDown={() => moveOptionDown(rootIndex, childIndex, 0)}
      duplicateOption={() => duplicateOption(rootIndex, childIndex, 0)}
      removeOption={() => removeOption(rootIndex, childIndex, 0)}
      onOptionChange={(index, v) =>
        onOptionChange(rootIndex, childIndex, index, v)
      }
    />
  );
}
