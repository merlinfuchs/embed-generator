import { ChevronRightIcon, TrashIcon } from "@heroicons/react/outline";
import { ExclamationCircleIcon } from "@heroicons/react/solid";
import { useState } from "react";
import { ZodFormattedError } from "zod";
import { ComponentSelectMenuOption } from "../discord/types";
import useMessage from "../hooks/useMessage";
import StyledInput from "./StyledInput";
import { useAutoAnimate } from "@formkit/auto-animate/react";

interface Props {
  option: ComponentSelectMenuOption;
  rowIndex: number;
  selectIndex: number;
  index: number;
  errors: ZodFormattedError<ComponentSelectMenuOption>;
}

export default function EditorComponentSelectOption({
  option,
  rowIndex,
  selectIndex,
  index,
  errors,
}: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [, dispatch] = useMessage();

  const [optionContainer] = useAutoAnimate<HTMLDivElement>();

  return (
    <div
      className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border border-dark-6"
      ref={optionContainer}
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
          <div className="flex-none">Select Option</div>
          {!!errors && <ExclamationCircleIcon className="text-red w-5 h-5" />}
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
            errors={errors?.label?._errors}
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
            errors={errors?.description?._errors}
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
            errors={errors?.value?._errors}
          />
        </div>
      )}
    </div>
  );
}
