import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DuplicateIcon,
  TrashIcon,
} from "@heroicons/react/outline";
import { useState } from "react";
import { Embed, EmbedField } from "../discord";
import useMessage from "../hooks/useMessage";

interface Props {
  field: EmbedField;
  index: number;
  embed: Embed;
  embedIndex: number;
}

export default function EditorEmbedField({
  field,
  index,
  embed,
  embedIndex,
}: Props) {
  const [, dispatch] = useMessage();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <div className="border border-dark-6 px-3 md:px-4 rounded-md mb-3">
        <div className="flex items-center py-3 overflow-hidden">
          <div
            className="text-medium flex-auto cursor-pointer flex items-center space-x-2 select-none"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronRightIcon
              className={`h-5 w-5 transition-transform duration-300 ${
                collapsed ? "" : "rotate-90"
              }`}
            />
            <div className="flex-none">Field {index + 1}</div>
            {field.name ? (
              <div className="text-gray-500 truncate">- {field.name}</div>
            ) : undefined}
          </div>
          <div className="flex space-x-3 flex-none">
            {index !== 0 && (
              <ChevronUpIcon
                className="h-4 w-4 cursor-pointer"
                onClick={() =>
                  dispatch({ type: "moveEmbedFieldUp", index, embedIndex })
                }
              />
            )}
            {index !== embed.fields.length - 1 && (
              <ChevronDownIcon
                className="h-4 w-4 cursor-pointer"
                onClick={() =>
                  dispatch({ type: "moveEmbedFieldDown", index, embedIndex })
                }
              />
            )}
            <DuplicateIcon
              className="h-4 w-4 cursor-pointer"
              onClick={() =>
                dispatch({ type: "cloneEmbedField", index, embedIndex })
              }
            />
            <TrashIcon
              className="h-4 w-4 cursor-pointer"
              onClick={() =>
                dispatch({ type: "removeEmbedField", index, embedIndex })
              }
            />
          </div>
        </div>
        {!collapsed ? (
          <div className="space-y-4 pb-3">
            <div>
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Name
              </div>
              <input
                type="text"
                className="bg-dark-2 rounded p-2 w-full no-ring font-light"
                value={field.name}
                onChange={(e) =>
                  dispatch({
                    type: "setEmbedFieldName",
                    value: e.target.value,
                    index,
                    embedIndex,
                  })
                }
              />
            </div>
            <div>
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Description
              </div>
              <textarea
                className="bg-dark-2 rounded p-2 w-full no-ring font-light"
                value={field.value}
                onChange={(e) =>
                  dispatch({
                    type: "setEmbedFieldValue",
                    value: e.target.value,
                    index,
                    embedIndex,
                  })
                }
              />
            </div>
          </div>
        ) : undefined}
      </div>
    </div>
  );
}
