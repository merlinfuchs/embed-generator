import { ChevronRightIcon, TrashIcon } from "@heroicons/react/outline";
import { useState } from "react";
import {
  ComponentSelectMenu,
  ComponentSelectMenuOption,
} from "../discord/types";
import useMessage from "../hooks/useMessage";
import StyledInput from "./StyledInput";

interface Props {
  option: ComponentSelectMenuOption;
  selectMenu: ComponentSelectMenu;
  rowIndex: number;
  selectIndex: number;
  index: number;
}

export default function EditorComponentSelectOption({
  option,
  selectMenu,
  rowIndex,
  selectIndex,
  index,
}: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [, dispatch] = useMessage();

  return (
    <div className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border border-dark-6">
      <div className="flex items-center">
        <div
          className="text-medium flex-auto cursor-pointer flex items-center space-x-2 select-none overflow-hidden"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronRightIcon
            className={`h-5 w-5 transition-transform duration-300 ${
              collapsed ? "" : "rotate-90"
            }`}
          />
          <div className="flex-none">Select Option</div>
          {option.label ? (
            <div className="text-gray-500 truncate">- {option.label}</div>
          ) : undefined}
        </div>
        <div className="flex space-x-3 flex-none">
          <TrashIcon
            className="h-5 w-5 cursor-pointer"
            onClick={() =>
              dispatch({
                type: "removeSelectMenuOption",
                index,
                rowIndex,
                selectIndex,
              })
            }
          />
        </div>
      </div>
      {!collapsed && (
        <div className="space-y-4 mt-3">
          <StyledInput
            className="flex-auto"
            type="text"
            label="Label"
            maxLength={100}
            value={option.label}
            onChange={(value) =>
              dispatch({
                type: "setSelectMenuOptionLabel",
                index,
                rowIndex,
                selectIndex,
                value,
              })
            }
          />
          <StyledInput
            className="flex-auto"
            type="text"
            label="Description"
            maxLength={100}
            value={option.description || ""}
            onChange={(value) =>
              dispatch({
                type: "setSelectMenuOptionDescription",
                index,
                rowIndex,
                selectIndex,
                value: value || undefined,
              })
            }
          />
          <StyledInput
            className="flex-auto"
            type="text"
            label="Response"
            maxLength={100}
            value={option.value}
            onChange={(value) =>
              dispatch({
                type: "setSelectMenuOptionValue",
                index,
                rowIndex,
                selectIndex,
                value,
              })
            }
          />
        </div>
      )}
    </div>
  );
}
