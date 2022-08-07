import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DuplicateIcon,
  TrashIcon,
} from "@heroicons/react/outline";
import { ExclamationCircleIcon } from "@heroicons/react/solid";
import { useMemo, useState } from "react";
import { ZodFormattedError } from "zod";
import { ComponentActionRow } from "../discord/types";
import useMessage from "../hooks/useMessage";
import EditorComponentButton from "./EditorComponentButton";
import EditorComponentSelect from "./EditorComponentSelect";
import useAutoAnimate from "../hooks/useAutoAnimate";

interface Props {
  index: number;
  row: ComponentActionRow;
  errors: ZodFormattedError<ComponentActionRow>;
}

export default function EditorComponentRow({ row, index, errors }: Props) {
  const [collapsed, setCollapsed] = useState(true);

  const [msg, dispatch] = useMessage();

  const isButtonRow = useMemo(
    () => row.components.every((c) => c.type === 2),
    [row]
  );

  const [rowSection] = useAutoAnimate<HTMLDivElement>();
  const [rowContainer] = useAutoAnimate<HTMLDivElement>();

  return (
    <div
      className="bg-dark-3 rounded-md px-3 md:px-4 py-3 mb-3 shadow"
      ref={rowSection}
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
          <div className="flex-none">Row {index + 1}</div>
          {!!errors && <ExclamationCircleIcon className="text-red w-5 h-5" />}
          <div className="flex-none text-gray-500 truncate">
            - {isButtonRow ? "Buttons" : "Select Menu"}
          </div>
        </div>
        <div className="flex space-x-3 flex-none">
          {index !== 0 ? (
            <ChevronUpIcon
              className="h-5 w-5 cursor-pointer"
              role="button"
              onClick={() => dispatch({ type: "moveComponentRowUp", index })}
            />
          ) : undefined}
          {index !== msg.components.length - 1 ? (
            <ChevronDownIcon
              className="h-5 w-5 cursor-pointer"
              role="button"
              onClick={() => dispatch({ type: "moveComponentRowDown", index })}
            />
          ) : undefined}
          {msg.components.length < 5 && (
            <DuplicateIcon
              className="h-5 w-5 cursor-pointer"
              role="button"
              onClick={() => dispatch({ type: "cloneComponentRow", index })}
            />
          )}
          <TrashIcon
            className="h-5 w-5 cursor-pointer"
            onClick={() => dispatch({ type: "removeComponentRow", index })}
          />
        </div>
      </div>
      {!collapsed && (
        <div className="mt-4">
          <div ref={rowContainer}>
            {row.components.map((comp, i) =>
              comp.type === 2 ? (
                <div key={comp.id}>
                  <EditorComponentButton
                    button={comp}
                    index={i}
                    rowIndex={index}
                    row={row}
                    errors={(errors?.components || [])[i]}
                  />
                </div>
              ) : (
                <EditorComponentSelect
                  key={comp.id}
                  selectMenu={comp}
                  index={i}
                  rowIndex={index}
                  errors={(errors?.components || [])[i]}
                />
              )
            )}
          </div>
          {isButtonRow && (
            <div className="space-x-3 mt-3">
              {row.components.length < 5 ? (
                <button
                  className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark"
                  onClick={() => dispatch({ type: "addButton", index })}
                >
                  Add Button
                </button>
              ) : (
                <button
                  disabled
                  className="bg-dark-2 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-300"
                >
                  Add Button
                </button>
              )}
              <button
                className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors"
                onClick={() => dispatch({ type: "clearComponents", index })}
              >
                Clear Components
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
