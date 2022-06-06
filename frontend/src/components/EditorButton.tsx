import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DuplicateIcon,
  TrashIcon,
} from "@heroicons/react/outline";
import { useMemo, useState } from "react";
import { Button } from "../discord";
import useMessage from "../hooks/useMessage";
import StyledInput from "./StyledInput";

interface Props {
  index: number;
  button: Button;
}

const buttonBorderColors = {
  1: "border-blurple",
  2: "border-dark-7",
  3: "border-green",
  4: "border-red",
  5: "border-dark-7",
};

export default function EditorButton({ index, button }: Props) {
  const [msg, dispatch] = useMessage();
  const [collapsed, setCollapsed] = useState(true);

  const borderColor = buttonBorderColors[button.style];

  return (
    <div
      className={`bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 ${borderColor}`}
    >
      <div className="flex items-center">
        <div
          className="text-medium text-lg flex-auto cursor-pointer flex items-center space-x-2 select-none overflow-hidden"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronRightIcon
            className={`h-6 w-6 transition-transform duration-300 ${
              collapsed ? "" : "rotate-90"
            }`}
          />
          <div className="flex-none">Button {index + 1}</div>
          {button.label ? (
            <div className="text-gray-500 truncate">- {button.label}</div>
          ) : undefined}
        </div>
        <div className="flex space-x-3 flex-none">
          {index !== 0 ? (
            <ChevronUpIcon
              className="h-5 w-5 cursor-pointer"
              role="button"
              onClick={() => dispatch({ type: "moveButtonUp", index })}
            />
          ) : undefined}
          {index !== (msg.components[0]?.components?.length || 0) - 1 ? (
            <ChevronDownIcon
              className="h-5 w-5 cursor-pointer"
              role="button"
              onClick={() => dispatch({ type: "moveButtonDown", index })}
            />
          ) : undefined}
          <DuplicateIcon
            className="h-5 w-5 cursor-pointer"
            role="button"
            onClick={() => dispatch({ type: "cloneButton", index })}
          />
          <TrashIcon
            className="h-5 w-5 cursor-pointer"
            onClick={() => dispatch({ type: "removeButton", index })}
          />
        </div>
      </div>
      {!collapsed && (
        <div className="space-y-4 mt-3">
          <div className="flex space-x-3">
            <div>
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Style
              </div>
              <select
                className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer"
                value={button.style.toString()}
                onChange={(e) =>
                  dispatch({
                    type: "setButtonStyle",
                    index,
                    value: parseInt(e.target.value) as any,
                  })
                }
              >
                <option value="1">Blurple</option>
                <option value="2">Grey</option>
                <option value="3">Green</option>
                <option value="4">Red</option>
                <option value="5">Direct Link</option>
              </select>
            </div>
            <StyledInput
              className="flex-auto"
              type="text"
              label="Label"
              maxLength={80}
              value={button.label || ""}
              onChange={(value) =>
                dispatch({ type: "setButtonLabel", index, value })
              }
            />
          </div>
          {button.style === 5 ? (
            <StyledInput
              type="url"
              label="URL"
              value={button.url || ""}
              onChange={(value) =>
                dispatch({ type: "setButtonUrl", index, value })
              }
            />
          ) : (
            <StyledInput
              type="text"
              label="Response"
              maxLength={100}
              value={button.custom_id}
              onChange={(value) =>
                dispatch({ type: "setButtonCustomId", index, value })
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
