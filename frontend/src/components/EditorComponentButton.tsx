import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DuplicateIcon,
  TrashIcon,
} from "@heroicons/react/outline";
import { ExclamationCircleIcon } from "@heroicons/react/solid";
import { useState } from "react";
import { ZodFormattedError } from "zod";
import { ComponentButton, ComponentActionRow } from "../discord/types";
import useMessage from "../hooks/useMessage";
import StyledInput from "./StyledInput";
import useAutoAnimate from "../hooks/useAutoAnimate";
import EditorComponentResponse from "./EditorComponentResponse";

interface Props {
  index: number;
  rowIndex: number;
  button: ComponentButton;
  row: ComponentActionRow;
  errors?: ZodFormattedError<ComponentButton>;
}

const buttonBorderColors = {
  1: "border-blurple",
  2: "border-dark-7",
  3: "border-green",
  4: "border-red",
  5: "border-dark-7",
};

export default function EditorComponentButton({
  index,
  rowIndex,
  button,
  row,
  errors,
}: Props) {
  const [, dispatch] = useMessage();
  const [collapsed, setCollapsed] = useState(true);

  const borderColor = buttonBorderColors[button.style];

  const [buttonContainer] = useAutoAnimate<HTMLDivElement>();

  return (
    <div
      className={`bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 ${borderColor}`}
      ref={buttonContainer}
    >
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
          <div className="flex-none">Button {index + 1}</div>
          {!!errors && <ExclamationCircleIcon className="text-red w-5 h-5" />}
          {button.label ? (
            <div className="text-gray-500 truncate">- {button.label}</div>
          ) : undefined}
        </div>
        <div className="flex space-x-3 flex-none">
          {index !== 0 ? (
            <ChevronUpIcon
              className="h-5 w-5 cursor-pointer"
              role="button"
              onClick={() =>
                dispatch({ type: "moveComponentUp", index, rowIndex })
              }
            />
          ) : undefined}
          {index !== (row.components.length || 0) - 1 ? (
            <ChevronDownIcon
              className="h-5 w-5 cursor-pointer"
              role="button"
              onClick={() =>
                dispatch({ type: "moveComponentDown", index, rowIndex })
              }
            />
          ) : undefined}
          {row.components.length < 5 && (
            <DuplicateIcon
              className="h-5 w-5 cursor-pointer"
              role="button"
              onClick={() =>
                dispatch({ type: "cloneComponent", index, rowIndex })
              }
            />
          )}
          <TrashIcon
            className="h-5 w-5 cursor-pointer"
            onClick={() =>
              dispatch({ type: "removeComponent", index, rowIndex })
            }
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
                    rowIndex,
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
                dispatch({ type: "setButtonLabel", index, rowIndex, value })
              }
              errors={errors?.label?._errors}
            />
          </div>
          {button.style === 5 ? (
            <StyledInput
              type="url"
              label="URL"
              value={button.url || ""}
              onChange={(value) =>
                dispatch({ type: "setButtonUrl", index, rowIndex, value })
              }
              errors={(errors as any)?.url?._errors}
            />
          ) : (
            <EditorComponentResponse
              customId={button.custom_id}
              setCustomId={(value) =>
                dispatch({
                  type: "setButtonCustomId",
                  index,
                  rowIndex,
                  value,
                })
              }
              errors={(errors as any)?.custom_id?._errors}
            />
          )}
        </div>
      )}
    </div>
  );
}
